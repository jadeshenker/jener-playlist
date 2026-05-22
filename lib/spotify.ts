import { auth } from "@/lib/auth"

const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

async function getAccessToken() {
  const session = await auth()

  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }

  return session.accessToken
}

export async function spotifyFetch(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken()

  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Spotify API error: ${response.status} ${text}`)
  }

  return response
}

type SpotifyPlaylistListItem = {
  id: string
  name: string
  owner?: { id: string }
  tracks?: { total: number }
  public?: boolean | null
  images?: { url: string; height?: number | null; width?: number | null }[]
}

/** `/me/playlists` includes followed playlists; keep only those owned by the current user. */
export async function fetchMyOwnedPlaylists(limit = 50): Promise<{
  items: SpotifyPlaylistListItem[]
}> {
  const [meResponse, playlistsResponse] = await Promise.all([
    spotifyFetch("/me"),
    spotifyFetch(`/me/playlists?limit=${limit}`),
  ])
  const me = (await meResponse.json()) as { id: string }
  const data = (await playlistsResponse.json()) as { items?: SpotifyPlaylistListItem[] }
  const userId = me.id
  const items = (data.items ?? []).filter((p) => p.owner?.id === userId)
  return { ...data, items }
}

/** True if the playlist exists and `owner.id` matches the authenticated Spotify user. */
export async function isCurrentUserPlaylistOwner(playlistId: string): Promise<boolean> {
  const [playlistResponse, meResponse] = await Promise.all([
    spotifyFetch(`/playlists/${playlistId}`),
    spotifyFetch("/me"),
  ])
  const playlist = (await playlistResponse.json()) as { owner?: { id?: string } }
  const me = (await meResponse.json()) as { id: string }
  return playlist.owner?.id === me.id
}
