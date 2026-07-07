"use client"

import Image from "next/image"
import Link from "next/link"
import { formatAddedAt } from "@/lib/format"
import { ArchivedSection, EmptyPlaylists, SearchInput, actionBtnClass } from "./shared"
import type { PlaylistListState, PlaylistWithMeta } from "./use-playlist-list"

function PlaylistCardList({
  playlists,
  showActions,
  onTogglePin,
  onToggleArchive,
}: {
  playlists: PlaylistWithMeta[]
  showActions: boolean
  onTogglePin: (id: string, name: string, current: boolean) => void
  onToggleArchive: (id: string, name: string, current: boolean) => void
}) {
  return (
    <ul className="m-0 list-none overflow-hidden border-t border-violet-300 p-0">
      {playlists.length ? (
        playlists.map((playlist) => (
          <li
            key={playlist.id}
            className={`box-border grid w-full items-center gap-2.5 border-b border-violet-300 bg-white px-3 py-2.5 ${
              showActions ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)]"
            }`}
          >
            <Link
              href={`/playlists/${playlist.id}`}
              className="flex min-w-0 items-center gap-2.5 overflow-hidden text-violet-700 no-underline"
            >
              {playlist.coverUrl ? (
                <Image
                  src={playlist.coverUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap underline">
                  {playlist.pinned ? <span className="mr-1 text-xs">📌</span> : null}
                  {playlist.name}
                </div>
                <div className="mt-0.5 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-[#888]">
                  {playlist.trackCount ?? 0} tracks
                  {playlist.dateCreated ? ` · ${formatAddedAt(playlist.dateCreated)}` : ""}
                </div>
              </div>
            </Link>
            {showActions && (
              <span className="inline-flex shrink-0 flex-col items-end gap-1">
                <button
                  onClick={() => onTogglePin(playlist.id, playlist.name, playlist.pinned)}
                  className={`${actionBtnClass} text-xs`}
                >
                  {playlist.pinned ? "[ unpin ]" : "[ pin ]"}
                </button>
                <button
                  onClick={() => onToggleArchive(playlist.id, playlist.name, playlist.archived)}
                  className={`${actionBtnClass} text-xs`}
                >
                  {playlist.archived ? "[ unarchive ]" : "[ archive ]"}
                </button>
              </span>
            )}
          </li>
        ))
      ) : (
        <EmptyPlaylists />
      )}
    </ul>
  )
}

export default function PlaylistListMobile({
  state,
  showActions,
}: {
  state: PlaylistListState
  showActions: boolean
}) {
  const {
    query,
    setQuery,
    sorted,
    archived,
    archivedOpen,
    toggleArchivedOpen,
    onTogglePin,
    onToggleArchive,
  } = state

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      <PlaylistCardList
        playlists={sorted}
        showActions={showActions}
        onTogglePin={onTogglePin}
        onToggleArchive={onToggleArchive}
      />
      {showActions && archived.length > 0 && (
        <ArchivedSection open={archivedOpen} count={archived.length} onToggle={toggleArchivedOpen}>
          <PlaylistCardList
            playlists={archived}
            showActions={showActions}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
          />
        </ArchivedSection>
      )}
    </div>
  )
}
