import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists as playlistsTable } from "@/lib/db/schema"
import PlaylistList, { type PlaylistWithMeta } from "@/components/playlist-list"
import { fetchMyOwnedPlaylists } from "@/lib/spotify"

export default async function PlaylistsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const [spotifyData, dbRows] = await Promise.all([
    fetchMyOwnedPlaylists(50),
    db.select({ id: playlistsTable.id, pinned: playlistsTable.pinned, archived: playlistsTable.archived, dateCreated: playlistsTable.dateCreated }).from(playlistsTable),
  ])

  const metaMap = new Map(dbRows.map((r) => [r.id, r]))

  const playlists: PlaylistWithMeta[] = (spotifyData.items ?? []).map((p) => ({
    ...p,
    pinned: metaMap.get(p.id)?.pinned === 1,
    archived: metaMap.get(p.id)?.archived === 1,
    dateCreated: metaMap.get(p.id)?.dateCreated ?? null,
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
