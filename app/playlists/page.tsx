import Link from "next/link"
import { redirect } from "next/navigation"
import PlaylistList from "@/components/playlist-list"
import { auth } from "@/lib/auth"
import { fetchMyOwnedPlaylists } from "@/lib/spotify"

export default async function PlaylistsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const data = await fetchMyOwnedPlaylists(50)

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
      <PlaylistList playlists={data.items ?? []} />
    </main>
  )
}
