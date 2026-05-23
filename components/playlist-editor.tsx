"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { formatAddedAt, formatDurationMs } from "@/lib/format"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"

export type PlaylistItem = {
  added_at?: string
  track: {
    id: string
    name: string
    uri: string
    duration_ms?: number
    artists?: { name: string }[]
    album?: {
      images?: { url: string; height?: number | null; width?: number | null }[]
    }
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

  type Tab = "songs" | "artists"
  const [activeTab, setActiveTab] = useState<Tab>("songs")
  const [artistsCopied, setArtistsCopied] = useState(false)
  const [songSearch, setSongSearch] = useState("")

  const simplifiedItems = useMemo(
    () =>
      items
        .map((item, itemsIndex) => ({ item, itemsIndex }))
        .filter(({ item }) => item.track)
        .map(({ item, itemsIndex }) => ({
          itemsIndex,
          id: item.track!.id,
          uri: item.track!.uri,
          name: item.track!.name,
          artists: item.track!.artists?.map((artist) => artist.name).join(", ") ?? "",
          albumCoverUrl: spotifyThumbnailUrl(item.track!.album?.images),
          durationMs: item.track!.duration_ms,
          addedAt: item.added_at,
        })),
    [items]
  )

  const filteredSongs = useMemo(() => {
    const query = songSearch.trim().toLowerCase()
    if (!query) return simplifiedItems
    return simplifiedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.artists.toLowerCase().includes(query)
    )
  }, [simplifiedItems, songSearch])

  const artistsInPlaylist = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      if (!item.track?.artists?.length) continue
      for (const artist of item.track.artists) {
        counts.set(artist.name, (counts.get(artist.name) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([name, trackCount]) => ({ name, trackCount }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

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

  const trackButtonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: "0.5rem 0.75rem",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "white",
    cursor: disabled ? "default" : "pointer",
  })

  async function copyArtistNames() {
    const text = artistsInPlaylist.map((artist) => artist.name).join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setArtistsCopied(true)
      window.setTimeout(() => setArtistsCopied(false), 2000)
    } catch {
      setError("Failed to copy artist names to clipboard")
    }
  }

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: active ? "#111" : "white",
    color: active ? "white" : "inherit",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
  })

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

      <div
        role="tablist"
        aria-label="Playlist views"
        style={{ display: "flex", gap: 8, marginBottom: "1rem" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "songs"}
          onClick={() => setActiveTab("songs")}
          style={tabButtonStyle(activeTab === "songs")}
        >
          songs ({simplifiedItems.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "artists"}
          onClick={() => setActiveTab("artists")}
          style={tabButtonStyle(activeTab === "artists")}
        >
          artists ({artistsInPlaylist.length})
        </button>
      </div>

      {activeTab === "artists" ? (
        <>
          {artistsInPlaylist.length > 0 ? (
            <div style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => void copyArtistNames()}
                style={trackButtonStyle(false)}
              >
                {artistsCopied ? "copied!" : "copy all artist names"}
              </button>
            </div>
          ) : null}
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {artistsInPlaylist.length === 0 ? (
            <li style={{ color: "#666", fontSize: 14 }}>No artists in this playlist yet.</li>
          ) : (
            artistsInPlaylist.map((artist) => (
              <li
                key={artist.name}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  background: "white",
                  padding: "0.9rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 600 }}>{artist.name}</div>
                <div style={{ fontSize: 14, color: "#666" }}>
                  {artist.trackCount} {artist.trackCount === 1 ? "track" : "tracks"}
                </div>
              </li>
            ))
          )}
        </ul>
        </>
      ) : null}

      {activeTab === "songs" ? (
      <>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="playlist-song-search" style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
            search songs
          </label>
          <input
            id="playlist-song-search"
            type="search"
            value={songSearch}
            onChange={(event) => setSongSearch(event.target.value)}
            placeholder="track or artist name"
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "0.6rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 15,
            }}
          />
          {songSearch.trim() ? (
            <p style={{ margin: "0.5rem 0 0", fontSize: 14, color: "#666" }}>
              {filteredSongs.length} of {simplifiedItems.length} songs
            </p>
          ) : null}
        </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {filteredSongs.length === 0 ? (
          <li style={{ color: "#666", fontSize: 14 }}>
            {simplifiedItems.length === 0
              ? "No songs in this playlist yet."
              : "No songs match your search."}
          </li>
        ) : null}
        {filteredSongs.map((item) => (
          <li
            key={`${item.id}-${item.itemsIndex}`}
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
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
              {item.albumCoverUrl ? (
                <Image
                  src={item.albumCoverUrl}
                  alt=""
                  width={56}
                  height={56}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "#eee",
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #e8e8e8 0%, #d4d4d4 100%)",
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{item.artists}</div>
              </div>
            </div>

            {item.addedAt ? (
              <div style={{ fontSize: 13, color: "#888", flexShrink: 0 }}>
                added {formatAddedAt(item.addedAt)}
              </div>
            ) : null}

            {item.durationMs != null ? (
              <div
                style={{
                  fontSize: 14,
                  color: "#666",
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}
              >
                {formatDurationMs(item.durationMs)}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                disabled={item.itemsIndex === 0 || isSaving}
                onClick={async () => {
                  const from = item.itemsIndex
                  moveItemLocally(from, from - 1)
                  await saveMove(from, from - 1)
                }}
                style={trackButtonStyle(item.itemsIndex === 0 || isSaving)}
              >
                up
              </button>
              <button
                disabled={item.itemsIndex === items.length - 1 || isSaving}
                onClick={async () => {
                  const from = item.itemsIndex
                  moveItemLocally(from, from + 1)
                  await saveMove(from, from + 1)
                }}
                style={trackButtonStyle(item.itemsIndex === items.length - 1 || isSaving)}
              >
                down
              </button>
              <button
                disabled={isSaving}
                onClick={async () => {
                  await removeItem(item.itemsIndex, item.uri)
                }}
                style={trackButtonStyle(isSaving)}
              >
                remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      </>
      ) : null}
    </div>
  )
}
