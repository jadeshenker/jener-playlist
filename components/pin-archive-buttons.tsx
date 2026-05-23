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

  const btnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: active ? "#f0f0f0" : "white",
    cursor: "pointer",
    color: "#555",
  })

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
      <button onClick={togglePin} style={btnStyle(pinned)}>
        {pinned ? "unpin" : "pin"}
      </button>
      <button onClick={toggleArchive} style={btnStyle(archived)}>
        {archived ? "unarchive" : "archive"}
      </button>
    </div>
  )
}
