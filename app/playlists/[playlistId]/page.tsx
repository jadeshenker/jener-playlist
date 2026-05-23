import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import PlaylistEditor, { type PlaylistItem } from "@/components/playlist-editor"
import PinArchiveButtons from "@/components/pin-archive-buttons"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists as playlistsTable } from "@/lib/db/schema"
import { formatDurationMs, sumTrackDurationMs } from "@/lib/format"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import { fetchAllPlaylistItems, spotifyFetch } from "@/lib/spotify"

type PlaylistPageProps = {
  params: Promise<{ playlistId: string }>
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { playlistId } = await params

  const [playlistResponse, meResponse, dbRow] = await Promise.all([
    spotifyFetch(`/playlists/${playlistId}`),
    spotifyFetch("/me"),
    db.select({ pinned: playlistsTable.pinned, archived: playlistsTable.archived }).from(playlistsTable).where(eq(playlistsTable.id, playlistId)).get(),
  ])

  const playlist = (await playlistResponse.json()) as {
    name: string
    description?: string
    owner?: { id: string }
    tracks?: { total: number }
    images?: { url: string; height?: number | null; width?: number | null }[]
  }
  const description = playlist.description?.trim()
  const coverUrl = spotifyThumbnailUrl(playlist.images, 200)
  const me = (await meResponse.json()) as { id: string }
  const owned = playlist.owner?.id === me.id

  let itemsData: { items: PlaylistItem[]; snapshot_id?: string } = { items: [] }
  if (owned) {
    itemsData = await fetchAllPlaylistItems<PlaylistItem>(playlistId)
  }

  const items = itemsData.items ?? []
  const totalDurationMs = owned ? sumTrackDurationMs(items) : 0

  return (
    <main style={{ padding: "2rem 1.5rem 3rem" }}>
      <Link href="/playlists" style={{ color: "#555" }}>
        ← back to playlists
      </Link>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginTop: "1rem",
        }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            width={160}
            height={160}
            style={{
              width: 160,
              height: 160,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              background: "#eee",
            }}
          />
        ) : null}
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>{playlist.name}</h1>
          <p style={{ color: "#555", marginTop: 12, marginBottom: 0 }}>
            {playlist.tracks?.total ?? 0} tracks
            {totalDurationMs > 0 ? (
              <>
                {" "}
                · {formatDurationMs(totalDurationMs)}
              </>
            ) : null}
          </p>
          {description ? (
            <p
              style={{
                color: "#444",
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.5,
                maxWidth: 560,
                whiteSpace: "pre-wrap",
              }}
            >
              {description}
            </p>
          ) : null}
          <PinArchiveButtons
            playlistId={playlistId}
            name={playlist.name}
            initialPinned={dbRow?.pinned === 1}
            initialArchived={dbRow?.archived === 1}
          />
        </div>
      </div>

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
