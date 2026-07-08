import { desc } from "drizzle-orm"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db/index"
import { playlists as playlistsTable } from "@/lib/db/schema"
import PlaylistList, { type PlaylistWithMeta } from "@/components/playlist-list"
import { SignInButton, SignOutButton } from "@/components/auth-button"
import SyncButton from "@/components/sync-button"

interface PlaylistRow {
  id: string
  name: string
  coverUrl: string | null
  trackCount: number | null
  pinned: number
  archived: number
  dateCreated: string | null
}

export default async function PlaylistsPage() {
  const session = await auth()

  let rows: PlaylistRow[]

  try {
    rows = await db
      .select({
        id: playlistsTable.id,
        name: playlistsTable.name,
        coverUrl: playlistsTable.coverUrl,
        trackCount: playlistsTable.trackCount,
        pinned: playlistsTable.pinned,
        archived: playlistsTable.archived,
        dateCreated: playlistsTable.dateCreated,
      })
      .from(playlistsTable)
      .orderBy(desc(playlistsTable.pinned), desc(playlistsTable.dateCreated))
  } catch {
    rows = []
  }

  const playlists: PlaylistWithMeta[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    coverUrl: r.coverUrl ?? null,
    trackCount: r.trackCount ?? null,
    pinned: r.pinned === 1,
    archived: r.archived === 1,
    dateCreated: r.dateCreated ?? null,
  }))

  return (
    <main className="mx-auto max-w-[960px] px-6 pt-8 pb-12 max-[650px]:px-0 max-[650px]:pt-4 max-[650px]:pb-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2 max-[650px]:px-3">
        <h1 className="m-0 text-lg text-[blue]"> _my_playlists ૮ ˶ᵔ ᵕ ᵔ˶ ა</h1>
        <div className="flex items-center gap-2">
          {session && (
            <Link href="/liked-songs" className="text-[13px] text-[blue] no-underline">
              [ liked songs ]
            </Link>
          )}
          {session && <SyncButton />}
          {session ? <SignOutButton /> : <SignInButton label="sign in" />}
        </div>
      </div>
      <PlaylistList playlists={playlists} showActions={!!session} />
    </main>
  )
}
