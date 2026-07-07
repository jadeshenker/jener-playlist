"use client"

import { ChevronDown, ChevronRight } from "pixelarticons/react"

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
