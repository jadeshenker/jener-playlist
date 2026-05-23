import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists as playlistsTable } from "@/lib/db/schema"
import PlaylistList, { type PlaylistWithMeta } from "@/components/playlist-list"
import { SignOutButton } from "@/components/auth-button"

export default async function PlaylistsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const rows = await db
    .select({
      id: playlistsTable.id,
      name: playlistsTable.name,
      coverUrl: playlistsTable.coverUrl,
      trackCount: playlistsTable.trackCount,
      pinned: playlistsTable.pinned,
      archived: playlistsTable.archived,
      dateCreated: playlistsTable.dateCreated,
    })
    .from(playlistsTable)
    .orderBy(desc(playlistsTable.pinned), desc(playlistsTable.dateCreated))

  const playlists: PlaylistWithMeta[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    coverUrl: r.coverUrl ?? null,
    trackCount: r.trackCount ?? null,
    pinned: r.pinned === 1,
    archived: r.archived === 1,
    dateCreated: r.dateCreated ?? null,
  }))

  return (
    <main style={{ padding: "2rem 1.5rem 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>your playlists</h1>
        <SignOutButton />
      </div>
      <PlaylistList playlists={playlists} />
    </main>
  )
}
