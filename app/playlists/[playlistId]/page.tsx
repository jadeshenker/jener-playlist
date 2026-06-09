import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import PlaylistEditor, { type PlaylistItem } from "@/components/playlist-editor"
import PinArchiveButtons from "@/components/pin-archive-buttons"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlistItems as playlistItemsTable, playlists as playlistsTable, playlistVersions } from "@/lib/db/schema"
import { formatDurationMs, sumTrackDurationMs } from "@/lib/format"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import { fetchAllPlaylistItems, spotifyFetch } from "@/lib/spotify"
import { ChevronLeft } from 'pixelarticons/react'

type PlaylistPageProps = {
  params: Promise<{ playlistId: string }>
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const session = await auth()
  const offline = Boolean(process.env.OFFLINE)

  if (!session && !offline) {
    redirect("/login")
  }

  const { playlistId } = await params

  let playlistName: string
  let description: string | undefined
  let coverUrl: string | undefined
  let trackCount: number
  let owned: boolean
  let items: PlaylistItem[]
  let snapshotId: string | undefined
  let pinnedVal: number
  let archivedVal: number

  if (offline) {
    const [dbPlaylist, latestVersion] = await Promise.all([
      db.select().from(playlistsTable).where(eq(playlistsTable.id, playlistId)).get(),
      db
        .select()
        .from(playlistVersions)
        .where(eq(playlistVersions.playlistId, playlistId))
        .orderBy(desc(playlistVersions.major), desc(playlistVersions.minor))
        .limit(1)
        .get(),
    ])

    if (!dbPlaylist) redirect("/playlists")

    const dbItems = latestVersion
      ? await db
          .select()
          .from(playlistItemsTable)
          .where(eq(playlistItemsTable.versionId, latestVersion.id))
          .orderBy(playlistItemsTable.position)
          .all()
      : []

    playlistName = dbPlaylist.name
    description = latestVersion?.description ?? undefined
    coverUrl = dbPlaylist.coverUrl ?? undefined
    trackCount = dbPlaylist.trackCount ?? dbItems.length
    owned = true
    snapshotId = latestVersion?.snapshotId
    pinnedVal = dbPlaylist.pinned
    archivedVal = dbPlaylist.archived
    items = dbItems.map((item) => ({
      added_at: item.addedAt ?? undefined,
      track: {
        id: item.trackId,
        name: item.trackName,
        uri: item.trackUri,
        duration_ms: item.durationMs ?? undefined,
        artists: item.artists ? item.artists.split(",").map((a) => ({ name: a.trim() })) : [],
      },
    }))
  } else {
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
    const me = (await meResponse.json()) as { id: string }

    playlistName = playlist.name
    description = playlist.description?.trim()
    coverUrl = spotifyThumbnailUrl(playlist.images, 200)
    trackCount = playlist.tracks?.total ?? 0
    owned = playlist.owner?.id === me.id
    pinnedVal = dbRow?.pinned ?? 0
    archivedVal = dbRow?.archived ?? 0

    if (owned) {
      const itemsData = await fetchAllPlaylistItems<PlaylistItem>(playlistId)
      items = itemsData.items ?? []
      snapshotId = itemsData.snapshot_id
    } else {
      items = []
    }
  }

  const totalDurationMs = owned ? sumTrackDurationMs(items) : 0

  return (
    <main>
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
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: "0.08em", fontWeight: 400 }}>{playlistName}</h1>
          <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
            {trackCount} tracks
            {totalDurationMs > 0 ? <> · {formatDurationMs(totalDurationMs)}</> : null}
          </p>
          {description ? (
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, lineHeight: 1.5, maxWidth: 560, whiteSpace: "pre-wrap", color: "#9461fb" }}>
              {description}
            </p>
          ) : null}
          <PinArchiveButtons
            playlistId={playlistId}
            name={playlistName}
            initialPinned={pinnedVal === 1}
            initialArchived={archivedVal === 1}
          />
        </div>
      </div>

      {owned ? (
        <PlaylistEditor
          playlistId={playlistId}
          initialItems={items}
          initialSnapshotId={snapshotId}
        />
      ) : (
        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", border: "1px solid #c4b5fd", borderRadius: 6, background: "#ede9fe", fontSize: 14 }}>
          <p style={{ margin: 0 }}>this isn&apos;t your playlist — you can only edit playlists you own</p>
        </div>
      )}
    </main>
  )
}
