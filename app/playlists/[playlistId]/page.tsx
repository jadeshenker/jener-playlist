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
import {
  playlistItems as playlistItemsTable,
  playlists as playlistsTable,
  playlistVersions,
} from "@/lib/db/schema"
import { formatAddedAt, formatDurationMs, sumTrackDurationMs } from "@/lib/format"
import { ChevronLeft } from "pixelarticons/react"

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
    <main className="mx-auto max-w-[960px] px-6 pt-8 pb-12 max-[650px]:px-0 max-[650px]:pt-4 max-[650px]:pb-8">
      <div className="flex items-center justify-between max-[650px]:px-3">
        <Link
          href="/playlists"
          className="inline-flex items-center gap-0.5 text-[13px] text-[blue] no-underline"
        >
          [ <ChevronLeft className="h-3.5 w-3.5" /> back ]
        </Link>
        <div className="flex gap-2">
          {session && <SyncButton playlistId={playlistId} />}
          {session ? <SignOutButton /> : <SignInButton label="sign in" />}
        </div>
      </div>

      <div className="mt-5 mb-6 flex items-start gap-5 max-[650px]:px-3">
        {dbPlaylist.coverUrl ? (
          <Image
            src={dbPlaylist.coverUrl}
            alt=""
            width={120}
            height={120}
            className="h-[120px] w-[120px] shrink-0 rounded-md object-cover"
          />
        ) : null}
        <div>
          <h1 className="m-0 text-[28px] font-normal tracking-[0.08em]">{dbPlaylist.name}</h1>
          <p className="mt-2 mb-0 text-[13px]">
            {dbPlaylist.dateCreated && (
              <span className="font-semibold">{formatAddedAt(dbPlaylist.dateCreated)} · </span>
            )}
            {trackCount} tracks
            {totalDurationMs > 0 ? <>, {formatDurationMs(totalDurationMs)}</> : null}
          </p>
          {latestVersion?.description ? (
            <p className="mt-2 mb-0 max-w-[560px] text-sm leading-normal whitespace-pre-wrap text-[#9461fb]">
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
