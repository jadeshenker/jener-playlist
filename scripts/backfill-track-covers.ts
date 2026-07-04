import { inArray, isNull } from "drizzle-orm"
import { db } from "../lib/db/index"
import { playlistItems } from "../lib/db/schema"
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
  return ((await res.json()) as { access_token: string }).access_token
}

type SpotifyTrack = {
  id: string
  album?: {
    images?: { url: string; height?: number | null; width?: number | null }[]
  }
}

async function fetchTracksBatch(token: string, ids: string[]): Promise<SpotifyTrack[]> {
  const res = await fetch(`${SPOTIFY_API}/tracks?ids=${ids.join(",")}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`/tracks: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { tracks: SpotifyTrack[] }
  return data.tracks
}

async function main() {
  const token = await getAccessToken()
  console.log("Got Spotify access token")

  // Get all rows missing a cover, then work with distinct track IDs
  const rows = await db
    .select({ id: playlistItems.id, trackId: playlistItems.trackId })
    .from(playlistItems)
    .where(isNull(playlistItems.albumCoverUrl))

  const uniqueTrackIds = [...new Set(rows.map((r) => r.trackId))]
  console.log(
    `${rows.length} rows missing album cover across ${uniqueTrackIds.length} distinct tracks\n`
  )

  if (uniqueTrackIds.length === 0) {
    console.log("Nothing to do.")
    process.exit(0)
  }

  // Fetch from Spotify in batches of 50 (API limit)
  const coverByTrackId = new Map<string, string | null>()
  for (let i = 0; i < uniqueTrackIds.length; i += 50) {
    const batch = uniqueTrackIds.slice(i, i + 50)
    const tracks = await fetchTracksBatch(token, batch)
    for (const track of tracks) {
      if (!track) continue
      coverByTrackId.set(track.id, spotifyThumbnailUrl(track.album?.images, 64) ?? null)
    }
    console.log(
      `  Fetched ${Math.min(i + 50, uniqueTrackIds.length)} / ${uniqueTrackIds.length} tracks`
    )
  }

  // Group row IDs by the cover URL they should receive
  const byUrl = new Map<string | null, number[]>()
  for (const row of rows) {
    const url = coverByTrackId.get(row.trackId) ?? null
    const bucket = byUrl.get(url) ?? []
    bucket.push(row.id)
    byUrl.set(url, bucket)
  }

  // Update in batches to avoid huge IN clauses
  let updated = 0
  for (const [url, ids] of byUrl) {
    for (let i = 0; i < ids.length; i += 200) {
      const batch = ids.slice(i, i + 200)
      await db
        .update(playlistItems)
        .set({ albumCoverUrl: url })
        .where(inArray(playlistItems.id, batch))
      updated += batch.length
    }
  }

  console.log(`\nUpdated ${updated} rows. Done!`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
