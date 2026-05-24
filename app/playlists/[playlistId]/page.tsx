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
import { ChevronLeft } from 'pixelarticons/react'

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
      <Link href="/playlists" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13, textDecoration: "none" }}>
        [ <ChevronLeft style={{ width: 14, height: 14 }} /> back to playlists ]
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginTop: "1.25rem", marginBottom: "1.5rem" }}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            width={120}
            height={120}
            style={{ width: 120, height: 120, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
          />
        ) : null}
        <div>
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: "0.08em", fontWeight: 400 }}>{playlist.name}</h1>
          <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
            {playlist.tracks?.total ?? 0} tracks
            {totalDurationMs > 0 ? <> · {formatDurationMs(totalDurationMs)}</> : null}
          </p>
          {description ? (
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, lineHeight: 1.5, maxWidth: 560, whiteSpace: "pre-wrap", color: "#9461fb" }}>
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
        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", border: "1px solid #c4b5fd", borderRadius: 6, background: "#ede9fe", fontSize: 14 }}>
          <p style={{ margin: 0 }}>this isn&apos;t your playlist — you can only edit playlists you own</p>
        </div>
      )}
    </main>
  )
}
