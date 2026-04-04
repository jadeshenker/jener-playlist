import { redirect } from "next/navigation"
import PlaylistList from "@/components/playlist-list"
import { auth } from "@/lib/auth"
import { spotifyFetch } from "@/lib/spotify"

export default async function PlaylistsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const response = await spotifyFetch("/me/playlists?limit=50")
  const data = await response.json()

  return (
    <main style={{ padding: "2rem 1.5rem 3rem" }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>your playlists</h1>
      <p style={{ color: "#555", marginTop: 12 }}>
        select a playlist to view and edit its songs.
      </p>
      <PlaylistList playlists={data.items ?? []} />
    </main>
  )
}
