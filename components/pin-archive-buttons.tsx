"use client"

import { useState } from "react"

const PURPLE = "#6d28d9"

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

  const btnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: PURPLE,
    textDecoration: "underline",
    padding: 0,
    font: "inherit",
    fontSize: 13,
  }

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
      <button onClick={togglePin} style={btnStyle}>
        {pinned ? "[ unpin ]" : "[ pin ]"}
      </button>
      <button onClick={toggleArchive} style={btnStyle}>
        {archived ? "[ unarchive ]" : "[ archive ]"}
      </button>
    </div>
  )
}
