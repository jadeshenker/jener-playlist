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

type SpotifyPlaylistsPage = {
  items?: SpotifyPlaylistListItem[]
  next?: string | null
}

type SpotifyPaginatedPage<T> = {
  items?: T[]
  next?: string | null
  snapshot_id?: string
}

function pathFromSpotifyNext(next: string): string {
  const url = new URL(next)
  return `${url.pathname.replace(/^\/v1/, "")}${url.search}`
}

/** Fetches every page of playlist tracks (Spotify max 100 per request). */
export async function fetchAllPlaylistItems<T>(playlistId: string, limit = 100): Promise<{
  items: T[]
  snapshot_id?: string
}> {
  const items: T[] = []
  let snapshot_id: string | undefined
  let path: string | null = `/playlists/${playlistId}/items?limit=${limit}`

  while (path) {
    const response = await spotifyFetch(path)
    const data = (await response.json()) as SpotifyPaginatedPage<T>
    if (data.snapshot_id) snapshot_id = data.snapshot_id
    items.push(...(data.items ?? []))
    path = data.next ? pathFromSpotifyNext(data.next) : null
  }

  return { items, snapshot_id }
}

/** `/me/playlists` includes followed playlists; keep only those owned by the current user. */
export async function fetchMyOwnedPlaylists(limit = 50): Promise<{
  items: SpotifyPlaylistListItem[]
}> {
  const meResponse = await spotifyFetch("/me")
  const me = (await meResponse.json()) as { id: string }
  const userId = me.id

  const items: SpotifyPlaylistListItem[] = []
  let path: string | null = `/me/playlists?limit=${limit}`

  while (path) {
    const playlistsResponse = await spotifyFetch(path)
    const data = (await playlistsResponse.json()) as SpotifyPlaylistsPage
    for (const playlist of data.items ?? []) {
      if (playlist.owner?.id === userId) items.push(playlist)
    }
    path = data.next ? pathFromSpotifyNext(data.next) : null
  }

  return { items }
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
