import { NextRequest, NextResponse } from "next/server"
import { sql, eq } from "drizzle-orm"
import { db } from "@/lib/db/index"
import { playlists } from "@/lib/db/schema"
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

  const response = await spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "DELETE",
    body: JSON.stringify({
      tracks: body.tracks,
      snapshot_id: body.snapshot_id,
    }),
  })

  const data = await response.json()

  await db
    .update(playlists)
    .set({
      trackCount: sql`MAX(0, COALESCE(${playlists.trackCount}, 0) - ${body.tracks.length})`,
      updatedAt: Date.now(),
    })
    .where(eq(playlists.id, playlistId))

  return NextResponse.json(data)
}
