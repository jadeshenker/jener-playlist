import Link from "next/link"
import { redirect } from "next/navigation"
import PlaylistEditor, { type PlaylistItem } from "@/components/playlist-editor"
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

  const [playlistResponse, meResponse] = await Promise.all([
    spotifyFetch(`/playlists/${playlistId}`),
    spotifyFetch("/me"),
  ])

  const playlist = (await playlistResponse.json()) as {
    name: string
    owner?: { id: string }
    tracks?: { total: number }
  }
  const me = (await meResponse.json()) as { id: string }
  const owned = playlist.owner?.id === me.id

  let itemsData: { items?: PlaylistItem[]; snapshot_id?: string } = {}
  if (owned) {
    const itemsResponse = await spotifyFetch(`/playlists/${playlistId}/items?limit=100`)
    itemsData = (await itemsResponse.json()) as {
      items?: PlaylistItem[]
      snapshot_id?: string
    }
  }

  return (
    <main style={{ padding: "2rem 1.5rem 3rem" }}>
      <Link href="/playlists" style={{ color: "#555" }}>
        ← back to playlists
      </Link>
      <h1 style={{ fontSize: 28, margin: "1rem 0 0" }}>{playlist.name}</h1>
      <p style={{ color: "#555", marginTop: 12 }}>
        {playlist.tracks?.total ?? 0} tracks
      </p>

      {owned ? (
        <PlaylistEditor
          playlistId={playlistId}
          initialItems={itemsData.items ?? []}
          initialSnapshotId={itemsData.snapshot_id}
        />
      ) : (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: 12,
            border: "1px solid #e0caca",
            background: "#fff8f8",
            color: "#444",
            maxWidth: 520,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>This isn’t your playlist</p>
          <p style={{ margin: "0.75rem 0 0", lineHeight: 1.5 }}>
            You can only reorder and remove tracks on playlists you created. Open one of your playlists from the list
            instead.
          </p>
        </div>
      )}
    </main>
  )
}
