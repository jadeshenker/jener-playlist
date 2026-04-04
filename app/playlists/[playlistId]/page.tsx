import Link from "next/link"
import { redirect } from "next/navigation"
import PlaylistEditor from "@/components/playlist-editor"
import { auth } from "@/lib/auth"
import { spotifyFetch } from "@/lib/spotify"

type PlaylistPageProps = {
  params: Promise<{ playlistId: string }>
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { playlistId } = await params

  const [playlistResponse, itemsResponse] = await Promise.all([
    spotifyFetch(`/playlists/${playlistId}`),
    spotifyFetch(`/playlists/${playlistId}/items?limit=100`),
  ])

  const playlist = await playlistResponse.json()
  const itemsData = await itemsResponse.json()

  return (
    <main style={{ padding: "2rem 1.5rem 3rem" }}>
      <Link href="/playlists" style={{ color: "#555" }}>
        ← back to playlists
      </Link>
      <h1 style={{ fontSize: 28, margin: "1rem 0 0" }}>{playlist.name}</h1>
      <p style={{ color: "#555", marginTop: 12 }}>
        {playlist.tracks?.total ?? 0} tracks
      </p>

      <PlaylistEditor
        playlistId={playlistId}
        initialItems={itemsData.items ?? []}
        initialSnapshotId={itemsData.snapshot_id}
      />
    </main>
  )
}
