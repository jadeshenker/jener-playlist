"use client"

import { actionBtnClass } from "@/components/playlist-editor/shared"

export function PaginationBar({
  offset,
  limit,
  total,
  isLoading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  offset: number
  limit: number
  total: number
  isLoading: boolean
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + limit, total)

  return (
    <div className="mb-4 flex items-center gap-3 max-[650px]:px-3">
      <button
        onClick={onPrev}
        disabled={!hasPrev || isLoading}
        className={actionBtnClass(!hasPrev || isLoading)}
      >
        [ prev ]
      </button>
      <span className="text-[13px] text-[#888]">
        {start}–{end} of {total}
      </span>
      <button
        onClick={onNext}
        disabled={!hasNext || isLoading}
        className={actionBtnClass(!hasNext || isLoading)}
      >
        [ next ]
      </button>
    </div>
  )
}
