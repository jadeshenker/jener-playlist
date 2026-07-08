"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Close, Grid3x3 } from "pixelarticons/react"
import { formatDurationMs } from "@/lib/format"
import { useSelection } from "./selection-context"

export default function SelectedSongsTray() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 750)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const { selected, remove, clear } = useSelection()

  if (!isDesktop || selected.length === 0) return null

  return (
    <div className="sticky top-8 mt-8 mr-8 mb-8 ml-6 w-[280px] shrink-0 self-start rounded border border-violet-300 bg-purple-50">
      <div className="flex items-center justify-between gap-2 rounded-t border-b border-violet-300 bg-violet-100 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-violet-700">
          {selected.length} songs selected
        </span>
        <button
          onClick={clear}
          className="shrink-0 cursor-pointer p-0 leading-none text-violet-700"
          title="clear selection"
        >
          <Close className="block h-4 w-4" />
        </button>
      </div>

      <ul className="m-0 max-h-[360px] list-none overflow-y-auto p-0">
        {selected.map((song) => (
          <li
            key={song.uri}
            className="flex items-center gap-2.5 border-b border-violet-300 px-3 py-2 last:border-b-0"
          >
            {song.albumCoverUrl ? (
              <Image
                src={song.albumCoverUrl}
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="size-9 shrink-0 rounded bg-violet-100" />
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-violet-700">
                {song.name}
              </div>
              <div className="mt-0.5 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-[#888]">
                {song.artists}
                {song.durationMs != null ? ` · ${formatDurationMs(song.durationMs)}` : ""}
              </div>
            </div>
            <button
              onClick={() => remove(song.uri)}
              className="shrink-0 cursor-pointer p-0 text-[15px] leading-none text-violet-700"
              title="remove"
            >
              <Close className="block h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-violet-300 px-3 py-2">
        <span className="text-[13px] text-[#888]">{selected.length} songs</span>
        <button disabled className="cursor-default p-0 leading-none text-violet-300" title="options">
          <Grid3x3 className="block h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
