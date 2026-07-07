"use client"

import Image from "next/image"
import Link from "next/link"
import { formatAddedAt } from "@/lib/format"
import { ChevronDown2 } from "pixelarticons/react"
import { ArchivedSection, EmptyPlaylists, SearchInput, actionBtnClass } from "./shared"
import type { PlaylistListState, PlaylistWithMeta } from "./use-playlist-list"

function PlaylistTable({
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
  const thClass = "border border-violet-300 px-3 py-2 font-medium text-violet-700"
  const tdClass = "border border-violet-300 px-3 py-2"
  return (
    <>
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col />
          <col className="w-20" />
          <col className="w-[130px]" />
          {showActions && <col className="w-[200px]" />}
        </colgroup>
        <thead>
          <tr className="bg-violet-100">
            <th className={`${thClass} text-left`}>playlist</th>
            <th className={`${thClass} text-center`}>tracks</th>
            <th className={`${thClass} text-center`}>
              created <ChevronDown2 className="inline h-[18px] w-[18px] align-middle" />
            </th>
            {showActions && <th className={`${thClass} text-center`}>actions</th>}
          </tr>
        </thead>
        <tbody>
          {playlists.map((playlist) => (
            <tr key={playlist.id} className="bg-white">
              <td className={tdClass}>
                <Link
                  href={`/playlists/${playlist.id}`}
                  className="flex items-center gap-2.5 text-violet-700 underline"
                >
                  {playlist.coverUrl ? (
                    <Image
                      src={playlist.coverUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <span>
                    {playlist.pinned ? <span className="mr-1 text-xs">📌</span> : null}
                    {playlist.name}
                  </span>
                </Link>
              </td>
              <td className={`${tdClass} text-center`}>{playlist.trackCount ?? 0}</td>
              <td className={`${tdClass} text-center whitespace-nowrap text-[#888]`}>
                {playlist.dateCreated ? formatAddedAt(playlist.dateCreated) : "—"}
              </td>
              {showActions && (
                <td className={`${tdClass} text-center whitespace-nowrap`}>
                  <span className="inline-flex gap-2">
                    <button
                      onClick={() => onTogglePin(playlist.id, playlist.name, playlist.pinned)}
                      className={actionBtnClass}
                    >
                      {playlist.pinned ? "[ unpin ]" : "[ pin ]"}
                    </button>
                    <button
                      onClick={() => onToggleArchive(playlist.id, playlist.name, playlist.archived)}
                      className={actionBtnClass}
                    >
                      {playlist.archived ? "[ unarchive ]" : "[ archive ]"}
                    </button>
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!playlists.length && <EmptyPlaylists border />}
    </>
  )
}

export default function PlaylistListDesktop({
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
      <PlaylistTable
        playlists={sorted}
        showActions={showActions}
        onTogglePin={onTogglePin}
        onToggleArchive={onToggleArchive}
      />
      {showActions && archived.length > 0 && (
        <ArchivedSection open={archivedOpen} count={archived.length} onToggle={toggleArchivedOpen}>
          <PlaylistTable
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
