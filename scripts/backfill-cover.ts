import { eq } from "drizzle-orm"
import { db } from "../lib/db/index"
import { playlists } from "../lib/db/schema"
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

async function spotifyGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify ${path}: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

type SpotifyPlaylistMeta = {
  images?: { url: string; height?: number | null; width?: number | null }[]
  tracks?: { total: number }
}

async function main() {
  const token = await getAccessToken()
  const allPlaylists = await db.select({ id: playlists.id, name: playlists.name }).from(playlists)
  console.log(`Updating ${allPlaylists.length} playlists...\n`)

  for (const playlist of allPlaylists) {
    const data = await spotifyGet<SpotifyPlaylistMeta>(
      token,
      `/playlists/${playlist.id}?fields=images,tracks(total)`
    )
    const coverUrl = spotifyThumbnailUrl(data.images, 56) ?? null
    const trackCount = data.tracks?.total ?? null

    await db
      .update(playlists)
      .set({ coverUrl, trackCount, updatedAt: Date.now() })
      .where(eq(playlists.id, playlist.id))

    console.log(`  ✓ ${playlist.name}: ${trackCount} tracks`)
  }

  console.log("\nDone!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
