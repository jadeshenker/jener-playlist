import Link from "next/link"
import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists as playlistsTable } from "@/lib/db/schema"
import PlaylistList, { type PlaylistWithMeta } from "@/components/playlist-list"

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
    .orderBy(desc(playlistsTable.pinned), playlistsTable.name)

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
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginBottom: 20,
          padding: "0.75rem 1rem",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "white",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        back to home
      </Link>
      <h1 style={{ fontSize: 28, margin: 0 }}>your playlists</h1>
      <p style={{ color: "#555", marginTop: 12 }}>
        select a playlist to view and edit its songs.
      </p>
      <PlaylistList playlists={playlists} />
    </main>
  )
}
