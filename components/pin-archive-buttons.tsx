"use client"

import { useState } from "react"

export default function PinArchiveButtons({
  playlistId,
  name,
  initialPinned,
  initialArchived,
}: {
  playlistId: string
  name: string
  initialPinned: boolean
  initialArchived: boolean
}) {
  const [pinned, setPinned] = useState(initialPinned)
  const [archived, setArchived] = useState(initialArchived)

  const patch = async (update: { pinned?: boolean; archived?: boolean }) => {
    await fetch(`/api/playlists/${playlistId}/meta`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...update }),
    })
  }

  const togglePin = () => {
    setPinned((v) => !v)
    patch({ pinned: !pinned })
  }

  const toggleArchive = () => {
    setArchived((v) => !v)
    patch({ archived: !archived })
  }

  const btnClass = "cursor-pointer p-0 text-[13px] text-violet-700 underline"

  return (
    <div className="mt-2.5 flex gap-3">
      <button onClick={togglePin} className={btnClass}>
        {pinned ? "[ unpin ]" : "[ pin ]"}
      </button>
      <button onClick={toggleArchive} className={btnClass}>
        {archived ? "[ unarchive ]" : "[ archive ]"}
      </button>
    </div>
  )
}
