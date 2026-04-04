import { NextRequest, NextResponse } from "next/server"
import { spotifyFetch } from "@/lib/spotify"

type RouteContext = {
  params: Promise<{ playlistId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { playlistId } = await params
  const response = await spotifyFetch(`/playlists/${playlistId}/items?limit=100`)
  const data = await response.json()
  return NextResponse.json(data)
}
