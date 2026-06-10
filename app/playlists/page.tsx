import { redirect } from "next/navigation"
import { desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists as playlistsTable } from "@/lib/db/schema"
import PlaylistList, { type PlaylistWithMeta } from "@/components/playlist-list"
import { SignOutButton } from "@/components/auth-button"

interface PlaylistRow {
    id: string;
    name: string;
    coverUrl: string | null;
    trackCount: number | null;
    pinned: number;
    archived: number;
    dateCreated: string | null;
}

export default async function PlaylistsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  
  let rows: PlaylistRow[];

  try {
    rows = await db
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
  } catch {
    rows = []
  }

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
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>playlists ૮ ˶ᵔ ᵕ ᵔ˶ ა</h1>
        <SignOutButton />
      </div>
      <PlaylistList playlists={playlists} />
    </main>
  )
}
