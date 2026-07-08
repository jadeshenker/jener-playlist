"use client"

import { Checkbox, CheckboxOn, ChevronDown, ChevronUp } from "pixelarticons/react"
import type { EditorTab } from "./use-playlist-editor"

export const actionBtnClass = (disabled: boolean) =>
  `p-0 text-[13px] ${
    disabled
      ? "cursor-default text-violet-300 no-underline"
      : "cursor-pointer text-violet-700 underline"
  }`

export function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div className="mb-4 rounded border border-violet-300 bg-violet-100 p-3 text-[13px]">
      {error}
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded border border-violet-300 bg-white px-4 py-2 text-[13px] text-violet-700 shadow-lg">
      {message}
    </div>
  )
}

export function TabBar({
  activeTab,
  onChange,
  songCount,
  artistCount,
}: {
  activeTab: EditorTab
  onChange: (tab: EditorTab) => void
  songCount: number
  artistCount: number
}) {
  const tabBtnClass = (active: boolean) =>
    `btn-outline ${
      active
        ? "border-violet-700 bg-[blue] text-white"
        : "border-violet-300 bg-violet-100 text-[blue]"
    }`
  return (
    <div className="mb-4 flex gap-2 max-[650px]:px-3">
      <button
        type="button"
        onClick={() => onChange("songs")}
        className={tabBtnClass(activeTab === "songs")}
      >
        songs ({songCount})
      </button>
      <button
        type="button"
        onClick={() => onChange("artists")}
        className={tabBtnClass(activeTab === "artists")}
      >
        artists ({artistCount})
      </button>
    </div>
  )
}

export function ArtistsPanel({
  artists,
  copied,
  onCopy,
}: {
  artists: { name: string; trackCount: number }[]
  copied: boolean
  onCopy: () => void
}) {
  const thClass = "border-b border-violet-300 px-3 py-2 font-medium text-violet-700"
  const tdClass = "border-b border-violet-300 px-3 py-2"
  return (
    <>
      {artists.length > 0 ? (
        <div className="mb-4 max-[650px]:px-3">
          <button type="button" onClick={onCopy} className={actionBtnClass(false)}>
            {copied ? "copied!" : "[ copy all artist names ]"}
          </button>
        </div>
      ) : null}
      <table className="w-full table-fixed border-collapse border border-violet-300 text-sm">
        <colgroup>
          <col />
          <col className="w-20" />
        </colgroup>
        <thead>
          <tr className="bg-violet-100">
            <th className={`${thClass} text-left`}>artist</th>
            <th className={`${thClass} text-center`}>tracks</th>
          </tr>
        </thead>
        <tbody>
          {artists.length === 0 ? (
            <tr>
              <td colSpan={2} className="border-b border-violet-300 p-3 text-[13px] text-[#888]">
                no artists yet
              </td>
            </tr>
          ) : (
            artists.map((artist) => (
              <tr key={artist.name} className="bg-white">
                <td className={`${tdClass} overflow-hidden text-ellipsis whitespace-nowrap`}>
                  {artist.name}
                </td>
                <td className={`${tdClass} text-center`}>{artist.trackCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}

export function SongSearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="mb-4 max-[650px]:px-3">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="track or artist name"
        className="w-full rounded border border-violet-300 bg-white px-3 py-2 text-sm text-violet-700 outline-none"
      />
    </div>
  )
}

export function SongSearchCount({ shown, total }: { shown: number; total: number }) {
  return (
    <p className="mb-3 text-[13px] text-[#888]">
      {shown} of {total} songs
    </p>
  )
}

export function BulkActionBar({
  selectedCount,
  showSelectAll,
  allFilteredSelected,
  isSaving,
  onToggleSelectAll,
  onMoveUp,
  onMoveDown,
  onRemove,
  onClear,
}: {
  selectedCount: number
  showSelectAll: boolean
  allFilteredSelected: boolean
  isSaving: boolean
  onToggleSelectAll: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onClear: () => void
}) {
  const noSelection = selectedCount === 0
  return (
    <div
      className={`sticky top-0 z-10 flex items-center gap-3 border-b border-violet-300 bg-purple-50 py-2 max-[650px]:px-3 ${
        showSelectAll ? "flex-wrap" : ""
      }`}
    >
      <span className="text-[13px] text-[#888]">{selectedCount} selected</span>
      {showSelectAll && (
        <button
          onClick={onToggleSelectAll}
          className={`${actionBtnClass(false)} inline-flex items-center gap-1`}
        >
          [{" "}
          {allFilteredSelected ? (
            <CheckboxOn className="block h-4 w-4" />
          ) : (
            <Checkbox className="block h-4 w-4" />
          )}
          all ]
        </button>
      )}
      <button
        onClick={onMoveUp}
        disabled={noSelection || isSaving}
        className={`${actionBtnClass(noSelection || isSaving)} inline-flex items-center gap-1`}
      >
        [ <ChevronUp className="block h-4 w-4" /> move up ]
      </button>
      <button
        onClick={onMoveDown}
        disabled={noSelection || isSaving}
        className={`${actionBtnClass(noSelection || isSaving)} inline-flex items-center gap-1`}
      >
        [ <ChevronDown className="block h-4 w-4" /> move down ]
      </button>
      <button
        onClick={onRemove}
        disabled={noSelection || isSaving}
        className={actionBtnClass(noSelection || isSaving)}
      >
        [ remove {selectedCount} ]
      </button>
      <button onClick={onClear} disabled={noSelection} className={actionBtnClass(noSelection)}>
        [ clear ]
      </button>
    </div>
  )
}
