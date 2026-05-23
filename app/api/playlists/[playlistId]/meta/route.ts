import { type NextRequest } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists } from "@/lib/db/schema"

type RouteContext = { params: Promise<{ playlistId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { playlistId } = await params
  const body = (await request.json()) as { name?: string; pinned?: boolean; archived?: boolean }
  const now = Date.now()

  const set: Record<string, unknown> = { updatedAt: now }
  if (typeof body.pinned === "boolean") set.pinned = body.pinned ? 1 : 0
  if (typeof body.archived === "boolean") set.archived = body.archived ? 1 : 0

  // Upsert so playlists created after the backfill can still be pinned/archived
  await db
    .insert(playlists)
    .values({
      id: playlistId,
      name: body.name ?? "Unknown",
      pinned: typeof body.pinned === "boolean" ? (body.pinned ? 1 : 0) : 0,
      archived: typeof body.archived === "boolean" ? (body.archived ? 1 : 0) : 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({ target: playlists.id, set })

  return new Response(null, { status: 204 })
}
