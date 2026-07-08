"use client"

import Image from "next/image"
import { formatAddedAt, formatDurationMs } from "@/lib/format"
import { ErrorBanner } from "@/components/playlist-editor/shared"
import { PaginationBar } from "./shared"
import type { LikedSongsState } from "./use-liked-songs"

export default function LikedSongsDesktop({ state }: { state: LikedSongsState }) {
  const { simplifiedItems, total, offset, limit, isLoading, error, hasPrev, hasNext, prevPage, nextPage } =
    state

  const thClass = "border border-violet-300 px-3 py-2 font-medium text-violet-700"
  const tdClass = "border border-violet-300 px-3 py-2"

  return (
    <div className="mt-2">
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

      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-11" />
          <col />
          <col className="w-[210px]" />
          <col className="w-[140px]" />
          <col className="w-[105px]" />
        </colgroup>
        <thead>
          <tr className="bg-violet-100">
            <th className={`${thClass} text-center`}>#</th>
            <th className={`${thClass} text-left`}>track</th>
            <th className={`${thClass} text-left`}>artist</th>
            <th className={`${thClass} text-center whitespace-nowrap`}>added</th>
            <th className={`${thClass} text-center whitespace-nowrap`}>duration</th>
          </tr>
        </thead>
        <tbody>
          {simplifiedItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-violet-300 p-3 text-[13px] text-[#888]">
                no liked songs found
              </td>
            </tr>
          ) : null}
          {simplifiedItems.map((item) => (
            <tr key={`${item.id}-${item.itemsIndex}`} className="bg-white">
              <td className={`${tdClass} text-center text-[#888]`}>
                {offset + item.itemsIndex + 1}
              </td>
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
              <td className={`${tdClass} text-center whitespace-nowrap tabular-nums text-[#888]`}>
                {item.durationMs != null ? formatDurationMs(item.durationMs) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
