"use client"

import { useMemo, useState } from "react"

type PlaylistItem = {
  track: {
    id: string
    name: string
    uri: string
    artists?: { name: string }[]
  } | null
}

export default function PlaylistEditor({
  playlistId,
  initialItems,
  initialSnapshotId,
}: {
  playlistId: string
  initialItems: PlaylistItem[]
  initialSnapshotId?: string
}) {
  const [items, setItems] = useState(initialItems)
  const [snapshotId, setSnapshotId] = useState(initialSnapshotId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simplifiedItems = useMemo(
    () =>
      items.filter((item) => item.track).map((item) => ({
        id: item.track!.id,
        uri: item.track!.uri,
        name: item.track!.name,
        artists: item.track!.artists?.map((artist) => artist.name).join(", ") ?? "",
      })),
    [items]
  )

  function moveItemLocally(from: number, to: number) {
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
  }

  async function saveMove(from: number, to: number) {
    setError(null)
    setIsSaving(true)

    try {
      const insertBefore = from < to ? to + 1 : to

      const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range_start: from,
          insert_before: insertBefore,
          range_length: 1,
          snapshot_id: snapshotId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save reorder")
      }

      const data = await response.json()
      setSnapshotId(data.snapshot_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function removeItem(index: number, uri: string) {
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`/api/playlists/${playlistId}/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracks: [{ uri }],
          snapshot_id: snapshotId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove track")
      }

      const data = await response.json()
      setSnapshotId(data.snapshot_id)
      setItems((current) => current.filter((item) => item.track?.uri !== uri || current.indexOf(item) !== index))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ marginBottom: "0.75rem", color: "#555", fontSize: 14 }}>
        v0 editor — reorder with up/down, remove songs, save directly to spotify
      </div>

      {error ? (
        <div
          style={{
            marginBottom: "1rem",
            background: "#fff0f0",
            border: "1px solid #ffd4d4",
            padding: "0.75rem",
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      ) : null}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {simplifiedItems.map((item, index) => (
          <li
            key={`${item.id}-${index}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "white",
              padding: "0.9rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{item.artists}</div>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                disabled={index === 0 || isSaving}
                onClick={async () => {
                  moveItemLocally(index, index - 1)
                  await saveMove(index, index - 1)
                }}
                style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", background: "white" }}
              >
                up
              </button>
              <button
                disabled={index === simplifiedItems.length - 1 || isSaving}
                onClick={async () => {
                  moveItemLocally(index, index + 1)
                  await saveMove(index, index + 1)
                }}
                style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", background: "white" }}
              >
                down
              </button>
              <button
                disabled={isSaving}
                onClick={async () => {
                  await removeItem(index, item.uri)
                }}
                style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #ccc", background: "white" }}
              >
                remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
