"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { formatAddedAt, formatDurationMs } from "@/lib/format"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import {
  Checkbox,
  CheckboxOn,
  ChevronDown,
  ChevronDown2,
  ChevronUp,
  Delete,
} from "pixelarticons/react"

const actionBtnClass = (disabled: boolean) =>
  `p-0 text-[13px] ${
    disabled
      ? "cursor-default text-violet-300 no-underline"
      : "cursor-pointer text-violet-700 underline"
  }`

function BulkActionBar({
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

export type PlaylistItem = {
  added_at?: string
  track: {
    id: string
    name: string
    uri: string
    duration_ms?: number
    artists?: { name: string }[]
    album?: {
      images?: { url: string; height?: number | null; width?: number | null }[]
    }
  } | null
}

export default function PlaylistEditor({
  playlistId,
  initialItems,
  initialSnapshotId,
  readOnly = false,
}: {
  playlistId: string
  initialItems: PlaylistItem[]
  initialSnapshotId?: string
  readOnly?: boolean
}) {
  const [items, setItems] = useState(initialItems)
  const [snapshotId, setSnapshotId] = useState(initialSnapshotId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  type Tab = "songs" | "artists"
  const [activeTab, setActiveTab] = useState<Tab>("songs")
  const [artistsCopied, setArtistsCopied] = useState(false)
  const [songSearch, setSongSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isNarrow, setIsNarrow] = useState(false)
  const [isXSmall, setIsXSmall] = useState(false)
  useEffect(() => {
    const check = () => {
      setIsNarrow(window.innerWidth < 900)
      setIsXSmall(window.innerWidth <= 500)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const simplifiedItems = useMemo(
    () =>
      items
        .map((item, itemsIndex) => ({ item, itemsIndex }))
        .filter(({ item }) => item.track)
        .map(({ item, itemsIndex }) => ({
          itemsIndex,
          id: item.track!.id,
          uri: item.track!.uri,
          name: item.track!.name,
          artists: item.track!.artists?.map((a) => a.name).join(", ") ?? "",
          albumCoverUrl: spotifyThumbnailUrl(item.track!.album?.images),
          durationMs: item.track!.duration_ms,
          addedAt: item.added_at,
        })),
    [items]
  )

  const filteredSongs = useMemo(() => {
    const query = songSearch.trim().toLowerCase()
    if (!query) return simplifiedItems
    return simplifiedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.artists.toLowerCase().includes(query)
    )
  }, [simplifiedItems, songSearch])

  const allFilteredSelected =
    filteredSongs.length > 0 && filteredSongs.every((item) => selected.has(item.uri))

  const toggleSelect = (uri: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uri)) next.delete(uri)
      else next.add(uri)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filteredSongs.forEach((item) => next.delete(item.uri))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filteredSongs.forEach((item) => next.add(item.uri))
        return next
      })
    }
  }

  async function moveSelectedUp() {
    if (selected.size === 0) return
    const selectedItems = simplifiedItems
      .filter((item) => selected.has(item.uri))
      .sort((a, b) => a.itemsIndex - b.itemsIndex)
    if (selectedItems.length === 0) return

    const occupied = new Set(selectedItems.map((item) => item.itemsIndex))
    const moves: { from: number; to: number }[] = []
    for (const item of selectedItems) {
      const from = item.itemsIndex
      const to = from - 1
      if (to < 0 || occupied.has(to)) continue
      moves.push({ from, to })
      occupied.delete(from)
      occupied.add(to)
    }
    if (moves.length === 0) return

    setItems((prev) => {
      const next = [...prev]
      for (const { from, to } of moves) {
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
      }
      return next
    })
    setError(null)
    setIsSaving(true)
    try {
      let currentSnapshotId = snapshotId
      for (const { from, to } of moves) {
        const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            range_start: from,
            insert_before: to,
            range_length: 1,
            snapshot_id: currentSnapshotId,
          }),
        })
        if (!response.ok) throw new Error("Failed to reorder")
        const data = await response.json()
        currentSnapshotId = data.snapshot_id
      }
      setSnapshotId(currentSnapshotId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function moveSelectedDown() {
    if (selected.size === 0) return
    const selectedItems = simplifiedItems
      .filter((item) => selected.has(item.uri))
      .sort((a, b) => b.itemsIndex - a.itemsIndex)
    if (selectedItems.length === 0) return

    const occupied = new Set(selectedItems.map((item) => item.itemsIndex))
    const moves: { from: number; to: number }[] = []
    for (const item of selectedItems) {
      const from = item.itemsIndex
      const to = from + 1
      if (to >= items.length || occupied.has(to)) continue
      moves.push({ from, to })
      occupied.delete(from)
      occupied.add(to)
    }
    if (moves.length === 0) return

    setItems((prev) => {
      const next = [...prev]
      for (const { from, to } of moves) {
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
      }
      return next
    })
    setError(null)
    setIsSaving(true)
    try {
      let currentSnapshotId = snapshotId
      for (const { from, to } of moves) {
        const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            range_start: from,
            insert_before: to + 1,
            range_length: 1,
            snapshot_id: currentSnapshotId,
          }),
        })
        if (!response.ok) throw new Error("Failed to reorder")
        const data = await response.json()
        currentSnapshotId = data.snapshot_id
      }
      setSnapshotId(currentSnapshotId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  const artistsInPlaylist = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      if (!item.track?.artists?.length) continue
      for (const artist of item.track.artists) {
        counts.set(artist.name, (counts.get(artist.name) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([name, trackCount]) => ({ name, trackCount }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  function moveItemLocally(from: number, to: number) {
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
  }

  async function saveMove(from: number, to: number) {
    setError(null)
    setIsSaving(true)
    try {
      const insertBefore = from < to ? to + 1 : to
      const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range_start: from,
          insert_before: insertBefore,
          range_length: 1,
          snapshot_id: snapshotId,
        }),
      })
      if (!response.ok) throw new Error("Failed to save reorder")
      const data = await response.json()
      setSnapshotId(data.snapshot_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function removeItem(index: number, uri: string) {
    setError(null)
    setIsSaving(true)
    try {
      const response = await fetch(`/api/playlists/${playlistId}/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: [{ uri }], snapshot_id: snapshotId }),
      })
      if (!response.ok) throw new Error("Failed to remove track")
      const data = await response.json()
      setSnapshotId(data.snapshot_id)
      setItems((current) => current.filter((item, i) => !(item.track?.uri === uri && i === index)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function removeSelectedItems() {
    if (selected.size === 0) return
    setError(null)
    setIsSaving(true)
    try {
      const toRemove = [...selected]
      const response = await fetch(`/api/playlists/${playlistId}/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: toRemove.map((uri) => ({ uri })), snapshot_id: snapshotId }),
      })
      if (!response.ok) throw new Error("Failed to remove tracks")
      const data = await response.json()
      setSnapshotId(data.snapshot_id)
      setItems((current) => current.filter((item) => !selected.has(item.track?.uri ?? "")))
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function copyArtistNames() {
    const text = artistsInPlaylist.map((a) => a.name).join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setArtistsCopied(true)
      window.setTimeout(() => setArtistsCopied(false), 2000)
    } catch {
      setError("Failed to copy artist names to clipboard")
    }
  }

  const tabBtnClass = (active: boolean) =>
    `btn-outline ${
      active
        ? "border-violet-700 bg-[blue] text-white"
        : "border-violet-300 bg-violet-100 text-[blue]"
    }`

  const thClass = `border-r border-b border-l border-violet-300 px-3 py-2 font-medium text-violet-700 ${
    readOnly ? "border-t" : ""
  }`
  const tdClass = "border border-violet-300 px-3 py-2"

  return (
    <div className="mt-2">
      {error ? (
        <div className="mb-4 rounded border border-violet-300 bg-violet-100 p-3 text-[13px]">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 max-[650px]:px-3">
        <button
          type="button"
          onClick={() => setActiveTab("songs")}
          className={tabBtnClass(activeTab === "songs")}
        >
          songs ({simplifiedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("artists")}
          className={tabBtnClass(activeTab === "artists")}
        >
          artists ({artistsInPlaylist.length})
        </button>
      </div>

      {activeTab === "artists" ? (
        <>
          {artistsInPlaylist.length > 0 ? (
            <div className="mb-4 max-[650px]:px-3">
              <button
                type="button"
                onClick={() => void copyArtistNames()}
                className={actionBtnClass(false)}
              >
                {artistsCopied ? "copied!" : "[ copy all artist names ]"}
              </button>
            </div>
          ) : null}
          <table className="w-full table-fixed border-collapse text-sm">
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
              {artistsInPlaylist.length === 0 ? (
                <tr>
                  <td colSpan={2} className="border border-violet-300 p-3 text-[13px] text-[#888]">
                    no artists yet
                  </td>
                </tr>
              ) : (
                artistsInPlaylist.map((artist) => (
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
      ) : null}

      {activeTab === "songs" ? (
        <>
          <div className="mb-4 max-[650px]:px-3">
            <input
              type="search"
              value={songSearch}
              onChange={(e) => {
                setSongSearch(e.target.value)
                setSelected(new Set())
              }}
              placeholder="track or artist name"
              className="w-full rounded border border-violet-300 bg-white px-3 py-2 text-sm text-violet-700 outline-none"
            />
          </div>

          {songSearch.trim() ? (
            <p className="mb-3 text-[13px] text-[#888]">
              {filteredSongs.length} of {simplifiedItems.length} songs
            </p>
          ) : null}

          {!readOnly && (
            <BulkActionBar
              selectedCount={selected.size}
              showSelectAll={isNarrow}
              allFilteredSelected={allFilteredSelected}
              isSaving={isSaving}
              onToggleSelectAll={toggleSelectAll}
              onMoveUp={() => void moveSelectedUp()}
              onMoveDown={() => void moveSelectedDown()}
              onRemove={() => void removeSelectedItems()}
              onClear={() => setSelected(new Set())}
            />
          )}

          {isNarrow ? (
            <ul
              className={`m-0 grid list-none gap-px overflow-hidden border-r border-l border-violet-300 p-0 ${
                readOnly ? "border-t" : ""
              }`}
            >
              {filteredSongs.length === 0 ? (
                <li className="bg-white p-3 text-[13px] text-[#888]">
                  {simplifiedItems.length === 0
                    ? "no songs in this playlist yet"
                    : "no songs match your search"}
                </li>
              ) : null}

              {filteredSongs.map((item) => (
                <li
                  key={`${item.id}-${item.itemsIndex}`}
                  className={`box-border grid w-full items-center gap-2.5 border-b border-violet-300 px-3 py-2.5 ${
                    selected.has(item.uri) ? "bg-violet-100" : "bg-white"
                  } ${
                    readOnly
                      ? "grid-cols-[auto_minmax(0,1fr)]"
                      : "grid-cols-[auto_auto_minmax(0,1fr)_auto]"
                  }`}
                >
                  {!readOnly && (
                    <button
                      onClick={() => toggleSelect(item.uri)}
                      className="cursor-pointer p-0 leading-none text-violet-700"
                    >
                      {selected.has(item.uri) ? (
                        <CheckboxOn className="h-[18px] w-[18px]" />
                      ) : (
                        <Checkbox className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  )}

                  {item.albumCoverUrl ? (
                    <Image
                      src={item.albumCoverUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-violet-100" />
                  )}

                  <div className="min-w-0 overflow-hidden">
                    <div className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">
                      {item.name}
                    </div>
                    <div className="mt-0.5 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-[#888]">
                      {item.artists}
                      {item.durationMs != null ? ` · ${formatDurationMs(item.durationMs)}` : ""}
                    </div>
                  </div>

                  {!readOnly && (
                    <span className="flex flex-row items-center gap-1">
                      <button
                        disabled={item.itemsIndex === 0 || isSaving}
                        onClick={async () => {
                          const from = item.itemsIndex
                          moveItemLocally(from, from - 1)
                          await saveMove(from, from - 1)
                        }}
                        className={`p-0 leading-none ${
                          item.itemsIndex === 0 || isSaving
                            ? "cursor-default text-violet-300"
                            : "cursor-pointer text-violet-700"
                        }`}
                        title="move up"
                      >
                        <ChevronUp className="block h-7 w-7" />
                      </button>
                      <button
                        disabled={item.itemsIndex === items.length - 1 || isSaving}
                        onClick={async () => {
                          const from = item.itemsIndex
                          moveItemLocally(from, from + 1)
                          await saveMove(from, from + 1)
                        }}
                        className={`p-0 leading-none ${
                          item.itemsIndex === items.length - 1 || isSaving
                            ? "cursor-default text-violet-300"
                            : "cursor-pointer text-violet-700"
                        }`}
                        title="move down"
                      >
                        <ChevronDown className="block h-7 w-7" />
                      </button>
                      {!isXSmall && (
                        <button
                          disabled={isSaving}
                          onClick={async () => {
                            await removeItem(item.itemsIndex, item.uri)
                          }}
                          className={`p-0 leading-none ${
                            isSaving
                              ? "cursor-default text-violet-300"
                              : "cursor-pointer text-violet-700"
                          }`}
                          title="remove"
                        >
                          <Delete className="block h-[26px] w-[26px]" />
                        </button>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                {!readOnly && <col className="w-11" />}
                <col className="w-11" />
                <col />
                <col className="w-[210px]" />
                <col className="w-[140px]" />
                <col className="w-[105px]" />
                {!readOnly && <col className="w-[130px]" />}
              </colgroup>
              <thead>
                <tr className="bg-violet-100">
                  {!readOnly && (
                    <th className={`${thClass} text-center`}>
                      <button
                        onClick={toggleSelectAll}
                        className="w-full cursor-pointer p-0 text-center leading-none text-violet-700"
                      >
                        {allFilteredSelected ? (
                          <CheckboxOn className="h-[18px] w-[18px]" />
                        ) : (
                          <Checkbox className="h-[18px] w-[18px]" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className={`${thClass} text-center`}>#</th>
                  <th className={`${thClass} text-left`}>track</th>
                  <th className={`${thClass} text-left`}>artist</th>
                  <th className={`${thClass} text-center whitespace-nowrap`}>
                    added <ChevronDown2 className="inline h-[18px] w-[18px] align-middle" />
                  </th>
                  <th className={`${thClass} text-center whitespace-nowrap`}>duration</th>
                  {!readOnly && (
                    <th className="border-r border-b border-l border-violet-300 px-3 py-2 text-center font-medium text-violet-700">
                      actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredSongs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={readOnly ? 5 : 7}
                      className="border border-violet-300 p-3 text-[13px] text-[#888]"
                    >
                      {simplifiedItems.length === 0
                        ? "no songs in this playlist yet"
                        : "no songs match your search"}
                    </td>
                  </tr>
                ) : null}
                {filteredSongs.map((item) => (
                  <tr
                    key={`${item.id}-${item.itemsIndex}`}
                    className={selected.has(item.uri) ? "bg-violet-100" : "bg-white"}
                  >
                    {!readOnly && (
                      <td className={`${tdClass} text-center`}>
                        <button
                          onClick={() => toggleSelect(item.uri)}
                          className="w-full cursor-pointer p-0 text-center leading-none text-violet-700"
                        >
                          {selected.has(item.uri) ? (
                            <CheckboxOn className="h-[18px] w-[18px]" />
                          ) : (
                            <Checkbox className="h-[18px] w-[18px]" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className={`${tdClass} text-center text-[#888]`}>{item.itemsIndex + 1}</td>
                    <td className={`${tdClass} overflow-hidden`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        {item.albumCoverUrl ? (
                          <Image
                            src={item.albumCoverUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="size-9 shrink-0 rounded bg-violet-100" />
                        )}
                        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className={`${tdClass} overflow-hidden text-ellipsis whitespace-nowrap`}>
                      {item.artists}
                    </td>
                    <td className={`${tdClass} text-center whitespace-nowrap text-[#888]`}>
                      {item.addedAt ? formatAddedAt(item.addedAt) : "—"}
                    </td>
                    <td
                      className={`${tdClass} text-center whitespace-nowrap tabular-nums text-[#888]`}
                    >
                      {item.durationMs != null ? formatDurationMs(item.durationMs) : "—"}
                    </td>
                    {!readOnly && (
                      <td className={`${tdClass} text-center whitespace-nowrap`}>
                        <span className="inline-flex gap-2.5">
                          <button
                            disabled={item.itemsIndex === 0 || isSaving}
                            onClick={async () => {
                              const from = item.itemsIndex
                              moveItemLocally(from, from - 1)
                              await saveMove(from, from - 1)
                            }}
                            className={`${actionBtnClass(item.itemsIndex === 0 || isSaving)} text-base`}
                            title="move up"
                          >
                            <ChevronUp />
                          </button>
                          <button
                            disabled={item.itemsIndex === items.length - 1 || isSaving}
                            onClick={async () => {
                              const from = item.itemsIndex
                              moveItemLocally(from, from + 1)
                              await saveMove(from, from + 1)
                            }}
                            className={`${actionBtnClass(
                              item.itemsIndex === items.length - 1 || isSaving
                            )} text-base`}
                            title="move down"
                          >
                            <ChevronDown />
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={async () => {
                              await removeItem(item.itemsIndex, item.uri)
                            }}
                            className={`${actionBtnClass(isSaving)} text-[15px]`}
                            title="remove"
                          >
                            <Delete />
                          </button>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : null}
    </div>
  )
}
