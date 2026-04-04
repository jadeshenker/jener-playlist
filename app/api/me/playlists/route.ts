import { NextResponse } from "next/server"
import { spotifyFetch } from "@/lib/spotify"

export async function GET() {
  const response = await spotifyFetch("/me/playlists?limit=50")
  const data = await response.json()
  return NextResponse.json(data)
}
