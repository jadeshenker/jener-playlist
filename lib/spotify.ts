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
