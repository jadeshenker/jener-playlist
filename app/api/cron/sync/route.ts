import { createHash } from "node:crypto"
import { desc, eq, and } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { playlists, playlistVersions, playlistItems } from "@/lib/db/schema"

const SPOTIFY_API = "https://api.spotify.com/v1"

async function getAccessToken(): Promise<string> {
  const { AUTH_SPOTIFY_ID, AUTH_SPOTIFY_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env
  if (!AUTH_SPOTIFY_ID || !AUTH_SPOTIFY_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error("Missing Spotify credentials in env")
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
  return ((await res.json()) as { access_token: string }).access_token
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

type SyncResult =
  | { id: string; name: string; status: "unchanged" }
  | { id: string; name: string; status: "same_content"; matchesVersion: string }
  | { id: string; name: string; status: "new_version"; version: string }
  | { id: string; name: string; status: "error"; error: string }

export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  let token: string
  try {
    token = await getAccessToken()
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const tracked = await db.select().from(playlists)
  const results: SyncResult[] = []

  for (const playlist of tracked) {
    try {
      const spotifyPlaylist = await spotifyGet<SpotifyPlaylistFull>(
        token,
        `/playlists/${playlist.id}?fields=id,name,description,snapshot_id`
      )

      if (spotifyPlaylist.snapshot_id === playlist.latestSnapshotId) {
        results.push({ id: playlist.id, name: playlist.name, status: "unchanged" })
        continue
      }

      const rawItems = await fetchAllPages<SpotifyPlaylistItem>(
        token,
        `/playlists/${playlist.id}/items?limit=100`
      )

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
      const now = Date.now()
      const description = spotifyPlaylist.description?.trim() || null

      // Always update the stored snapshot_id and name
      await db
        .update(playlists)
        .set({ name: spotifyPlaylist.name, latestSnapshotId: spotifyPlaylist.snapshot_id, updatedAt: now })
        .where(eq(playlists.id, playlist.id))

      // Check if content is identical to an existing version
      const existingVersion = await db
        .select({ id: playlistVersions.id, major: playlistVersions.major, minor: playlistVersions.minor })
        .from(playlistVersions)
        .where(and(eq(playlistVersions.playlistId, playlist.id), eq(playlistVersions.contentHash, hash)))
        .get()

      if (existingVersion) {
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

      results.push({
        id: playlist.id,
        name: spotifyPlaylist.name,
        status: "new_version",
        version: `${newMajor}.${newMinor}`,
      })
    } catch (err) {
      results.push({ id: playlist.id, name: playlist.name, status: "error", error: String(err) })
    }
  }

  return NextResponse.json({ results })
}
