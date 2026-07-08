"use client"

import Image from "next/image"
import { Fragment, useRef, useState } from "react"
import { formatAddedAt, formatDurationMs } from "@/lib/format"
import {
  Checkbox,
  CheckboxOn,
  ChevronDown,
  ChevronDown2,
  ChevronUp,
  Delete,
} from "pixelarticons/react"
import { TRAY_SONGS_DRAG_MIME } from "@/components/selection/tray"
import {
  ArtistsPanel,
  BulkActionBar,
  ErrorBanner,
  SongSearchBar,
  SongSearchCount,
  TabBar,
  Toast,
  actionBtnClass,
} from "./shared"
import type { PlaylistEditorState } from "./use-playlist-editor"

export default function PlaylistEditorDesktop({
  editor,
  readOnly,
}: {
  editor: PlaylistEditorState
  readOnly: boolean
}) {
  const {
    items,
    isSaving,
    error,
    activeTab,
    setActiveTab,
    artistsCopied,
    songSearch,
    updateSongSearch,
    selected,
    toggleSelect,
    toggleSelectAll,
    clearSelected,
    simplifiedItems,
    filteredSongs,
    allFilteredSelected,
    moveSelectedUp,
    moveSelectedDown,
    artistsInPlaylist,
    moveItemLocally,
    saveMove,
    removeItem,
    removeSelectedItems,
    addSelectedSongsAfter,
    copyArtistNames,
  } = editor

  const thClass = "border-b border-violet-300 px-3 py-2 font-medium text-violet-700"
  const tdClass = "border-b border-violet-300 px-3 py-2"

  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [pendingDropIndex, setPendingDropIndex] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(message)
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500)
  }

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly || !e.dataTransfer.types.includes(TRAY_SONGS_DRAG_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDropTargetIndex(index)
  }

  const handleRowDrop = async (e: React.DragEvent, index: number) => {
    if (readOnly || !e.dataTransfer.types.includes(TRAY_SONGS_DRAG_MIME)) return
    e.preventDefault()
    setDropTargetIndex(null)
    setPendingDropIndex(index)
    const count = await addSelectedSongsAfter(index)
    setPendingDropIndex(null)
    if (count > 0) showToast(`added ${count} song${count === 1 ? "" : "s"} to playlist`)
  }

  const handleTableDragLeave = (e: React.DragEvent<HTMLTableSectionElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTargetIndex(null)
  }

  return (
    <div className="mt-2">
      <ErrorBanner error={error} />

      <TabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        songCount={simplifiedItems.length}
        artistCount={artistsInPlaylist.length}
      />

      {activeTab === "artists" ? (
        <ArtistsPanel
          artists={artistsInPlaylist}
          copied={artistsCopied}
          onCopy={() => void copyArtistNames()}
        />
      ) : null}

      {activeTab === "songs" ? (
        <>
          <SongSearchBar value={songSearch} onChange={updateSongSearch} />

          {songSearch.trim() ? (
            <SongSearchCount shown={filteredSongs.length} total={simplifiedItems.length} />
          ) : null}

          {!readOnly && (
            <BulkActionBar
              selectedCount={selected.size}
              showSelectAll={false}
              allFilteredSelected={allFilteredSelected}
              isSaving={isSaving}
              onToggleSelectAll={toggleSelectAll}
              onMoveUp={() => void moveSelectedUp()}
              onMoveDown={() => void moveSelectedDown()}
              onRemove={() => void removeSelectedItems()}
              onClear={clearSelected}
            />
          )}

          <table
            className={`w-full table-fixed border-collapse border-x border-b border-violet-300 text-sm ${
              readOnly ? "border-t" : ""
            }`}
          >
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
                  <th className="border-b border-violet-300 px-3 py-2 text-center font-medium text-violet-700">
                    actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody onDragLeave={handleTableDragLeave}>
              {filteredSongs.length === 0 ? (
                <tr
                  onDragOver={(e) => handleRowDragOver(e, -1)}
                  onDrop={(e) => void handleRowDrop(e, -1)}
                >
                  <td
                    colSpan={readOnly ? 5 : 7}
                    className="border-b border-violet-300 p-3 text-[13px] text-[#888]"
                  >
                    {simplifiedItems.length === 0
                      ? "no songs in this playlist yet"
                      : "no songs match your search"}
                  </td>
                </tr>
              ) : null}
              {simplifiedItems.length === 0 &&
                (dropTargetIndex === -1 || pendingDropIndex === -1) && (
                  <tr
                    onDragOver={(e) => handleRowDragOver(e, -1)}
                    onDrop={(e) => void handleRowDrop(e, -1)}
                  >
                    <td
                      colSpan={readOnly ? 5 : 7}
                      className={`h-10 border-b border-dashed border-violet-400 p-0 ${
                        pendingDropIndex === -1 ? "drop-pending-row" : "bg-violet-100"
                      }`}
                    />
                  </tr>
                )}
              {filteredSongs.map((item) => (
                <Fragment key={`${item.id}-${item.itemsIndex}`}>
                  <tr
                    onDragOver={(e) => handleRowDragOver(e, item.itemsIndex)}
                    onDrop={(e) => void handleRowDrop(e, item.itemsIndex)}
                    className={selected.has(item.uri) ? "bg-violet-100" : "bg-white"}
                  >
                    {!readOnly && (
                      <td className={`${tdClass} text-center`}>
                        <button
                          onClick={(e) => toggleSelect(item.uri, e.shiftKey)}
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
                  {(dropTargetIndex === item.itemsIndex ||
                    pendingDropIndex === item.itemsIndex) && (
                    <tr
                      onDragOver={(e) => handleRowDragOver(e, item.itemsIndex)}
                      onDrop={(e) => void handleRowDrop(e, item.itemsIndex)}
                    >
                      <td
                        colSpan={readOnly ? 5 : 7}
                        className={`h-10 border-b border-dashed border-violet-400 p-0 ${
                          pendingDropIndex === item.itemsIndex
                            ? "drop-pending-row"
                            : "bg-violet-100"
                        }`}
                      />
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <Toast message={toastMessage} />
    </div>
  )
}
