import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import PlaylistEditor, { type PlaylistItem } from "@/components/playlist-editor"
import PinArchiveButtons from "@/components/pin-archive-buttons"
import { SignInButton, SignOutButton } from "@/components/auth-button"
import SyncButton from "@/components/sync-button"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlistItems as playlistItemsTable, playlists as playlistsTable, playlistVersions } from "@/lib/db/schema"
import { formatAddedAt, formatDurationMs, sumTrackDurationMs } from "@/lib/format"
import { ChevronLeft } from 'pixelarticons/react'

type PlaylistPageProps = {
  params: Promise<{ playlistId: string }>
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const session = await auth()
  const { playlistId } = await params

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

  if (!dbPlaylist) notFound()

  const dbItems = latestVersion
    ? await db
        .select()
        .from(playlistItemsTable)
        .where(eq(playlistItemsTable.versionId, latestVersion.id))
        .orderBy(playlistItemsTable.position)
        .all()
    : []

  const items: PlaylistItem[] = dbItems.map((item) => ({
    added_at: item.addedAt ?? undefined,
    track: {
      id: item.trackId,
      name: item.trackName,
      uri: item.trackUri,
      duration_ms: item.durationMs ?? undefined,
      artists: item.artists ? item.artists.split(", ").map((a) => ({ name: a.trim() })) : [],
      album: item.albumCoverUrl ? { images: [{ url: item.albumCoverUrl }] } : undefined,
    },
  }))

  const totalDurationMs = sumTrackDurationMs(items)
  const trackCount = dbPlaylist.trackCount ?? dbItems.length

  return (
    <main>
      <div className="mobile-pad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/playlists" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13, textDecoration: "none" }}>
          [ <ChevronLeft style={{ width: 14, height: 14 }} /> back ]
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          {session && <SyncButton playlistId={playlistId} />}
          {session ? <SignOutButton /> : <SignInButton label="sign in" />}
        </div>
      </div>

      <div className="mobile-pad" style={{ display: "flex", alignItems: "flex-start", gap: 20, marginTop: "1.25rem", marginBottom: "1.5rem" }}>
        {dbPlaylist.coverUrl ? (
          <Image
            src={dbPlaylist.coverUrl}
            alt=""
            width={120}
            height={120}
            style={{ width: 120, height: 120, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
          />
        ) : null}
        <div>
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: "0.08em", fontWeight: 400 }}>{dbPlaylist.name}</h1>
          <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
            {dbPlaylist.dateCreated && <span style={{ fontWeight: 600 }}>{formatAddedAt(dbPlaylist.dateCreated)} · </span>}{trackCount} tracks
            {totalDurationMs > 0 ? <>, {formatDurationMs(totalDurationMs)}</> : null}
          </p>
          {latestVersion?.description ? (
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, lineHeight: 1.5, maxWidth: 560, whiteSpace: "pre-wrap", color: "#9461fb" }}>
              {latestVersion.description}
            </p>
          ) : null}
          {session && (
            <PinArchiveButtons
              playlistId={playlistId}
              name={dbPlaylist.name}
              initialPinned={dbPlaylist.pinned === 1}
              initialArchived={dbPlaylist.archived === 1}
            />
          )}
        </div>
      </div>

      <PlaylistEditor
        playlistId={playlistId}
        initialItems={items}
        initialSnapshotId={undefined}
        readOnly={!session}
      />
    </main>
  )
}