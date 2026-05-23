import { createHash } from "node:crypto"
import { db } from "../lib/db/index"
import { playlists, playlistVersions, playlistItems } from "../lib/db/schema"
import { and, eq } from "drizzle-orm"
import { spotifyThumbnailUrl } from "../lib/spotify-images"

const SPOTIFY_API = "https://api.spotify.com/v1"

async function getAccessToken(): Promise<string> {
  const { AUTH_SPOTIFY_ID, AUTH_SPOTIFY_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env
  if (!AUTH_SPOTIFY_ID || !AUTH_SPOTIFY_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error("Missing AUTH_SPOTIFY_ID, AUTH_SPOTIFY_SECRET, or SPOTIFY_REFRESH_TOKEN in env")
  }
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${AUTH_SPOTIFY_ID}:${AUTH_SPOTIFY_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

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

type SpotifyPaginatedPage<T> = {
  items?: T[]
  next?: string | null
}

async function fetchAllPages<T>(token: string, initialPath: string): Promise<T[]> {
  const items: T[] = []
  let path: string | null = initialPath
  while (path) {
    const currentPath = path
    const data: SpotifyPaginatedPage<T> = await spotifyGet<SpotifyPaginatedPage<T>>(token, currentPath)
    items.push(...(data.items ?? []))
    path = data.next ? pathFromNext(data.next) : null
  }
  return items
}

function contentHash(uris: string[]): string {
  return createHash("sha256").update(uris.join("\n")).digest("hex")
}

type SpotifyPlaylist = {
  id: string
  name: string
  description?: string
  snapshot_id: string
  owner?: { id: string }
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
  } | null
}

async function main() {
  const token = await getAccessToken()
  console.log("Got Spotify access token")

  const me = await spotifyGet<{ id: string }>(token, "/me")
  console.log(`Logged in as Spotify user: ${me.id}`)

  const allPlaylists = await fetchAllPages<SpotifyPlaylist>(token, "/me/playlists?limit=50")
  const owned = allPlaylists.filter((p) => p.owner?.id === me.id)
  console.log(`Found ${owned.length} owned playlists\n`)

  const now = Date.now()

  for (const playlist of owned) {
    // Fetch full playlist object for description + snapshot_id
    const full = await spotifyGet<SpotifyPlaylist>(token, `/playlists/${playlist.id}`)

    // Skip if v1.0 already exists
    const existing = await db
      .select({ id: playlistVersions.id })
      .from(playlistVersions)
      .where(
        and(
          eq(playlistVersions.playlistId, playlist.id),
          eq(playlistVersions.major, 1),
          eq(playlistVersions.minor, 0)
        )
      )
      .get()

    if (existing) {
      console.log(`  Skipped: ${full.name} (v1.0 already exists)`)
      continue
    }

    const rawItems = await fetchAllPages<SpotifyPlaylistItem>(
      token,
      `/playlists/${playlist.id}/items?limit=100`
    )

    // Filter out local files and null tracks
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
      }))

    const hash = contentHash(tracks.map((t) => t.trackUri))
    const description = full.description?.trim() || null
    const coverUrl = spotifyThumbnailUrl(full.images, 56) ?? null
    const trackCount = full.tracks?.total ?? null

    await db
      .insert(playlists)
      .values({
        id: full.id,
        name: full.name,
        coverUrl,
        trackCount,
        latestSnapshotId: full.snapshot_id,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: playlists.id,
        set: { name: full.name, coverUrl, trackCount, latestSnapshotId: full.snapshot_id, updatedAt: now },
      })

    const [version] = await db
      .insert(playlistVersions)
      .values({
        playlistId: full.id,
        major: 1,
        minor: 0,
        snapshotId: full.snapshot_id,
        contentHash: hash,
        name: full.name,
        description,
        note: "initial backfill",
        createdAt: now,
      })
      .returning()

    if (tracks.length > 0) {
      await db.insert(playlistItems).values(
        tracks.map((t) => ({ versionId: version.id, ...t }))
      )
    }

    console.log(`  ✓ ${full.name} — v1.0, ${tracks.length} tracks`)
  }

  console.log("\nBackfill complete!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
