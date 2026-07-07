"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { formatDurationMs } from "@/lib/format"
import { Checkbox, CheckboxOn, ChevronDown, ChevronUp, Delete } from "pixelarticons/react"
import {
  ArtistsPanel,
  BulkActionBar,
  ErrorBanner,
  SongSearchBar,
  SongSearchCount,
  TabBar,
} from "./shared"
import type { PlaylistEditorState } from "./use-playlist-editor"

export default function PlaylistEditorMobile({
  editor,
  readOnly,
}: {
  editor: PlaylistEditorState
  readOnly: boolean
}) {
  const [isXSmall, setIsXSmall] = useState(false)
  useEffect(() => {
    const check = () => setIsXSmall(window.innerWidth <= 500)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

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
    copyArtistNames,
  } = editor

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
              showSelectAll={true}
              allFilteredSelected={allFilteredSelected}
              isSaving={isSaving}
              onToggleSelectAll={toggleSelectAll}
              onMoveUp={() => void moveSelectedUp()}
              onMoveDown={() => void moveSelectedDown()}
              onRemove={() => void removeSelectedItems()}
              onClear={clearSelected}
            />
          )}

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
        </>
      ) : null}
    </div>
  )
}
