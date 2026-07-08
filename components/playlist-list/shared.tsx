"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "pixelarticons/react"
import { formatAddedAt } from "@/lib/format"
import type { PlaylistWithMeta } from "./use-playlist-list"

export const actionBtnClass = "cursor-pointer p-0 text-[13px] text-violet-700 underline"

export function EmptyPlaylists({ border }: { border?: boolean }) {
  return (
    <div
      className={`bg-white p-3 text-center text-sm ${border ? "border border-t-0 border-violet-300" : ""}`}
    >
      no playlists. make one?
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="mt-6 mb-4 max-[650px]:px-3">
      <input
        type="search"
        placeholder="search playlists"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-violet-300 bg-white px-3 py-2 text-base text-violet-700 outline-none"
      />
    </div>
  )
}

export function PlaylistCardList({
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
    <ul className="m-0 list-none overflow-hidden border border-violet-300 p-0">
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

export function ArchivedSection({
  open,
  count,
  onToggle,
  children,
}: {
  open: boolean
  count: number
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className="flex cursor-pointer items-center gap-1 border-0 bg-transparent py-1 text-xs text-[#888]"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        view archived ({count})
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}
