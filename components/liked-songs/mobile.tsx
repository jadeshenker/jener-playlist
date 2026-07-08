"use client"

import Image from "next/image"
import { Checkbox, CheckboxOn } from "pixelarticons/react"
import { formatDurationMs } from "@/lib/format"
import { ErrorBanner } from "@/components/playlist-editor/shared"
import { PaginationBar } from "./shared"
import type { LikedSongsState } from "./use-liked-songs"

export default function LikedSongsMobile({ state }: { state: LikedSongsState }) {
  const {
    simplifiedItems,
    total,
    offset,
    limit,
    isLoading,
    error,
    hasPrev,
    hasNext,
    prevPage,
    nextPage,
    selected,
    toggleSelect,
  } = state

  return (
    <div>
      <ErrorBanner error={error} />

      <PaginationBar
        offset={offset}
        limit={limit}
        total={total}
        isLoading={isLoading}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => void prevPage()}
        onNext={() => void nextPage()}
      />

      <ul className="m-0 grid list-none gap-px overflow-hidden border-t border-r border-l border-violet-300 p-0">
        {simplifiedItems.length === 0 ? (
          <li className="bg-white p-3 text-[13px] text-[#888]">no liked songs found</li>
        ) : null}
        {simplifiedItems.map((item) => (
          <li
            key={`${item.id}-${item.itemsIndex}`}
            className={`box-border grid w-full grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2.5 border-b border-violet-300 px-3 py-2.5 ${
              selected.has(item.uri) ? "bg-violet-100" : "bg-white"
            }`}
          >
            <button
              onClick={(e) => toggleSelect(item.uri, e.shiftKey)}
              className="cursor-pointer p-0 leading-none text-violet-700"
            >
              {selected.has(item.uri) ? (
                <CheckboxOn className="h-[18px] w-[18px]" />
              ) : (
                <Checkbox className="h-[18px] w-[18px]" />
              )}
            </button>
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
          </li>
        ))}
      </ul>
    </div>
  )
}
