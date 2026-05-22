import { NextRequest, NextResponse } from "next/server"
import { fetchAllPlaylistItems } from "@/lib/spotify"

type RouteContext = {
  params: Promise<{ playlistId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { playlistId } = await params
  const data = await fetchAllPlaylistItems(playlistId)
  return NextResponse.json(data)
}
