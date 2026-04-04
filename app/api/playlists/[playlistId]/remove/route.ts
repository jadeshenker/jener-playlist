import { NextRequest, NextResponse } from "next/server"
import { isCurrentUserPlaylistOwner, spotifyFetch } from "@/lib/spotify"

type RouteContext = {
  params: Promise<{ playlistId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { playlistId } = await params

  if (!(await isCurrentUserPlaylistOwner(playlistId))) {
    return NextResponse.json({ error: "You can only edit playlists you own." }, { status: 403 })
  }

  const body = await request.json()

  const response = await spotifyFetch(`/playlists/${playlistId}/items`, {
    method: "DELETE",
    body: JSON.stringify({
      tracks: body.tracks,
      snapshot_id: body.snapshot_id,
    }),
  })

  const data = await response.json()
  return NextResponse.json(data)
}
