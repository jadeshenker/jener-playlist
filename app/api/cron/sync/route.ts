import { createHash } from "node:crypto"
import { desc, eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists, playlistVersions, playlistItems } from "@/lib/db/schema"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"

const SPOTIFY_API = "https://api.spotify.com/v1"

async function spotifyGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify ${path}: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

function pathFromNext(next: string): string {
  const url = new URL(next)
  return `${url.pathname.replace(/^\/v1/, "")}${url.search}`
}

type SpotifyPage<T> = { items?: T[]; next?: string | null }

async function fetchAllPages<T>(token: string, initialPath: string): Promise<T[]> {
  const items: T[] = []
  let path: string | null = initialPath
  while (path) {
    const page: SpotifyPage<T> = await spotifyGet<SpotifyPage<T>>(token, path)
    items.push(...(page.items ?? []))
    path = page.next ? pathFromNext(page.next) : null
  }
  return items
}

function contentHash(uris: string[]): string {
  return createHash("sha256").update(uris.join("\n")).digest("hex")
}

type SpotifyPlaylistFull = {
  id: string
  name: string
  description?: string
  snapshot_id: string
  images?: { url: string; height?: number | null; width?: number | null }[]
  tracks?: { total: number }
}

type SpotifyPlaylistItem = {
  added_at?: string
  track: {
    id: string
    name: string
    uri: string
    duration_ms?: number
    artists?: { name: string }[]
    album?: { images?: { url: string; height?: number | null; width?: number | null }[] }
  } | null
}

type SyncResult =
  | { id: string; name: string; status: "unchanged" }
  | { id: string; name: string; status: "same_content"; matchesVersion: string }
  | { id: string; name: string; status: "new_version"; version: string }
  | { id: string; name: string; status: "error"; error: string }

async function discoverNewPlaylists(token: string): Promise<string[]> {
  const page = await spotifyGet<SpotifyPage<SpotifyPlaylistFull>>(token, `/me/playlists?limit=10`)
  const existing = new Set(
    (await db.select({ id: playlists.id }).from(playlists)).map((p) => p.id)
  )
  const toAdd: { id: string; name: string; latestSnapshotId: string; coverUrl: string | null; trackCount: number | null; pinned: number; archived: number; dateCreated: string | null; createdAt: number; updatedAt: number }[] = []
  const now = Date.now()
  for (const item of page.items ?? []) {
    if (existing.has(item.id)) break
    if (!item.tracks?.total) continue
    const rawItems = await fetchAllPages<SpotifyPlaylistItem>(token, `/playlists/${item.id}/items?limit=100`)
    const addedDates = rawItems
      .filter((i) => i.track?.uri?.startsWith("spotify:track:") && i.added_at)
      .map((i) => i.added_at!)
    const dateCreated = addedDates.length > 0 ? addedDates.sort()[0].slice(0, 10) : null
    toAdd.push({
      id: item.id,
      name: item.name,
      latestSnapshotId: item.snapshot_id,
      coverUrl: spotifyThumbnailUrl(item.images, 56) ?? null,
      trackCount: item.tracks?.total ?? null,
      pinned: 0,
      archived: 0,
      dateCreated,
      createdAt: now,
      updatedAt: now,
    })
  }
  if (toAdd.length > 0) await db.insert(playlists).values(toAdd)
  return toAdd.map((p) => p.name)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accessToken || session.error === "RefreshTokenError") {
    return new Response("Unauthorized", { status: 401 })
  }
  const token = session.accessToken

  let targetId: string | null = null
  try {
    const body = await request.json() as { playlistId?: string }
    targetId = body.playlistId ?? null
  } catch { /* no body — sync all */ }

  try {
    let discovered: string[] = []
    let tracked: (typeof playlists.$inferSelect)[]

    if (targetId) {
      const row = await db.select().from(playlists).where(eq(playlists.id, targetId)).get()
      tracked = row ? [row] : []
    } else {
      console.log("[CRON] Discovering new playlists...")
      discovered = await discoverNewPlaylists(token)
      console.log("[CRON] Discovered playlists:", discovered)
      tracked = await db.select().from(playlists).where(eq(playlists.archived, 0))
    }

    console.log(`[CRON] Syncing ${tracked.length} playlists`)

    const results: SyncResult[] = []

    for (const playlist of tracked) {
      try {
        console.log(`[CRON] Syncing playlist: ${playlist.id} (${playlist.name})`)
        const spotifyPlaylist = await spotifyGet<SpotifyPlaylistFull>(
          token,
          `/playlists/${playlist.id}?fields=id,name,description,snapshot_id,images,tracks(total)`
        )

        if (spotifyPlaylist.snapshot_id === playlist.latestSnapshotId) {
          console.log(`[CRON] Playlist ${playlist.id} unchanged`)
          results.push({ id: playlist.id, name: playlist.name, status: "unchanged" })
          continue
        }

        console.log(`[CRON] Playlist ${playlist.id} changed, fetching tracks...`)
        const rawItems = await fetchAllPages<SpotifyPlaylistItem>(
          token,
          `/playlists/${playlist.id}/items?limit=100`
        )
        console.log(`[CRON] Fetched ${rawItems.length} items for ${playlist.id}`)

        const tracks = rawItems
          .filter((item) => item.track?.uri?.startsWith("spotify:track:"))
          .map((item, i) => ({
            position: i,
            trackId: item.track!.id,
            trackUri: item.track!.uri,
            trackName: item.track!.name,
            durationMs: item.track!.duration_ms ?? null,
            artists: item.track!.artists?.map((a) => a.name).join(", ") ?? null,
            addedAt: item.added_at ?? null,
            albumCoverUrl: spotifyThumbnailUrl(item.track!.album?.images, 64) ?? null,
          }))

        const hash = contentHash(tracks.map((t) => t.trackUri).sort())
        const now = Date.now()
        const description = spotifyPlaylist.description?.trim() || null

        const coverUrl = spotifyThumbnailUrl(spotifyPlaylist.images, 56) ?? null
        const trackCount = spotifyPlaylist.tracks?.total ?? null

        // Always update the stored snapshot_id, name, cover, and track count
        await db
          .update(playlists)
          .set({ name: spotifyPlaylist.name, coverUrl, trackCount, latestSnapshotId: spotifyPlaylist.snapshot_id, updatedAt: now })
          .where(eq(playlists.id, playlist.id))

        // Check if content is identical to an existing version
        const existingVersion = await db
          .select({ id: playlistVersions.id, major: playlistVersions.major, minor: playlistVersions.minor })
          .from(playlistVersions)
          .where(and(eq(playlistVersions.playlistId, playlist.id), eq(playlistVersions.contentHash, hash)))
          .get()

        if (existingVersion) {
          console.log(`[CRON] Playlist ${playlist.id} content matches version ${existingVersion.major}.${existingVersion.minor}`)
          results.push({
            id: playlist.id,
            name: spotifyPlaylist.name,
            status: "same_content",
            matchesVersion: `${existingVersion.major}.${existingVersion.minor}`,
          })
          continue
        }

        // Determine next version number (always increment minor)
        const latest = await db
          .select({ major: playlistVersions.major, minor: playlistVersions.minor })
          .from(playlistVersions)
          .where(eq(playlistVersions.playlistId, playlist.id))
          .orderBy(desc(playlistVersions.major), desc(playlistVersions.minor))
          .limit(1)
          .get()

        const newMajor = latest?.major ?? 1
        const newMinor = (latest?.minor ?? -1) + 1

        const [newVersion] = await db
          .insert(playlistVersions)
          .values({
            playlistId: playlist.id,
            major: newMajor,
            minor: newMinor,
            snapshotId: spotifyPlaylist.snapshot_id,
            contentHash: hash,
            name: spotifyPlaylist.name,
            description,
            createdAt: now,
          })
          .returning()

        if (tracks.length > 0) {
          await db.insert(playlistItems).values(tracks.map((t) => ({ versionId: newVersion.id, ...t })))
        }

        console.log(`[CRON] Created new version for ${playlist.id}: ${newMajor}.${newMinor}`)
        results.push({
          id: playlist.id,
          name: spotifyPlaylist.name,
          status: "new_version",
          version: `${newMajor}.${newMinor}`,
        })
      } catch (err) {
        console.error(`[CRON] Error syncing playlist ${playlist.id}:`, err)
        results.push({ id: playlist.id, name: playlist.name, status: "error", error: String(err) })
      }
    }

    console.log("[CRON] Sync complete:", results)
    return NextResponse.json({ discovered, results })
  } catch (err) {
    console.error("[CRON] Unexpected error:", err)
    return NextResponse.json({ error: String(err), stack: err instanceof Error ? err.stack : undefined }, { status: 500 })
  }
}
