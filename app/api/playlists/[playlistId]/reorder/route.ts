import { NextRequest, NextResponse } from "next/server"
import { spotifyFetch } from "@/lib/spotify"

type RouteContext = {
  params: Promise<{ playlistId: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { playlistId } = await params
  const body = await request.json()

  const response = await spotifyFetch(`/playlists/${playlistId}/items`, {
    method: "PUT",
    body: JSON.stringify({
      range_start: body.range_start,
      insert_before: body.insert_before,
      range_length: body.range_length ?? 1,
      snapshot_id: body.snapshot_id,
    }),
  })

  const data = await response.json()
  return NextResponse.json(data)
}
