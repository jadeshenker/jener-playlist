import { NextRequest, NextResponse } from "next/server"
import { sql, eq } from "drizzle-orm"
import { db } from "@/lib/db/index"
import { playlists } from "@/lib/db/schema"
import { fetchAllPlaylistItems, isCurrentUserPlaylistOwner, spotifyFetch } from "@/lib/spotify"

type RouteContext = {
  params: Promise<{ playlistId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { playlistId } = await params
  const data = await fetchAllPlaylistItems(playlistId)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { playlistId } = await params

  if (!(await isCurrentUserPlaylistOwner(playlistId))) {
    return NextResponse.json({ error: "You can only edit playlists you own." }, { status: 403 })
  }

  const body = await request.json()

  const response = await spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({
      uris: body.uris,
      position: body.position,
    }),
  })

  const data = await response.json()

  await db
    .update(playlists)
    .set({
      trackCount: sql`COALESCE(${playlists.trackCount}, 0) + ${body.uris.length}`,
      updatedAt: Date.now(),
    })
    .where(eq(playlists.id, playlistId))

  return NextResponse.json(data)
}
