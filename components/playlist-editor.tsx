"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { formatAddedAt, formatDurationMs } from "@/lib/format"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import { Checkbox, CheckboxOn, ChevronDown, ChevronDown2, ChevronUp, Delete } from 'pixelarticons/react'

const PURPLE = "#6d28d9"
const BORDER = "#c4b5fd"
const HEADER_BG = "#ede9fe"

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
  const [selected, setSelected] = useState<Set<string>>(new Set())

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
          artists: item.track!.artists?.map((a) => a.name).join(", ") ?? "",
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
      (item) => item.name.toLowerCase().includes(query) || item.artists.toLowerCase().includes(query)
    )
  }, [simplifiedItems, songSearch])

  const allFilteredSelected = filteredSongs.length > 0 && filteredSongs.every((item) => selected.has(item.uri))

  const toggleSelect = (uri: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uri)) next.delete(uri)
      else next.add(uri)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filteredSongs.forEach((item) => next.delete(item.uri))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filteredSongs.forEach((item) => next.add(item.uri))
        return next
      })
    }
  }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range_start: from, insert_before: insertBefore, range_length: 1, snapshot_id: snapshotId }),
      })
      if (!response.ok) throw new Error("Failed to save reorder")
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: [{ uri }], snapshot_id: snapshotId }),
      })
      if (!response.ok) throw new Error("Failed to remove track")
      const data = await response.json()
      setSnapshotId(data.snapshot_id)
      setItems((current) => current.filter((item, i) => !(item.track?.uri === uri && i === index)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function removeSelectedItems() {
    if (selected.size === 0) return
    setError(null)
    setIsSaving(true)
    try {
      const toRemove = [...selected]
      const response = await fetch(`/api/playlists/${playlistId}/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: toRemove.map((uri) => ({ uri })), snapshot_id: snapshotId }),
      })
      if (!response.ok) throw new Error("Failed to remove tracks")
      const data = await response.json()
      setSnapshotId(data.snapshot_id)
      setItems((current) => current.filter((item) => !selected.has(item.track?.uri ?? "")))
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function copyArtistNames() {
    const text = artistsInPlaylist.map((a) => a.name).join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setArtistsCopied(true)
      window.setTimeout(() => setArtistsCopied(false), 2000)
    } catch {
      setError("Failed to copy artist names to clipboard")
    }
  }

  const actionBtnStyle = (disabled: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: disabled ? "default" : "pointer",
    color: disabled ? "#c4b5fd" : PURPLE,
    textDecoration: disabled ? "none" : "underline",
    padding: 0,
    font: "inherit",
    fontSize: 13,
  })

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.4rem 0.875rem",
    border: `1px solid ${BORDER}`,
    borderRadius: 4,
    background: active ? PURPLE : HEADER_BG,
    color: active ? "white" : PURPLE,
    cursor: "pointer",
    font: "inherit",
    fontSize: 13,
  })

  return (
    <div style={{ marginTop: "0.5rem" }}>

      {error ? (
        <div style={{ marginBottom: "1rem", background: HEADER_BG, border: `1px solid ${BORDER}`, padding: "0.75rem", borderRadius: 4, fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <button type="button" onClick={() => setActiveTab("songs")} style={tabBtnStyle(activeTab === "songs")}>
          songs ({simplifiedItems.length})
        </button>
        <button type="button" onClick={() => setActiveTab("artists")} style={tabBtnStyle(activeTab === "artists")}>
          artists ({artistsInPlaylist.length})
        </button>
      </div>

      {activeTab === "artists" ? (
        <>
          {artistsInPlaylist.length > 0 ? (
            <div style={{ marginBottom: "1rem" }}>
              <button type="button" onClick={() => void copyArtistNames()} style={actionBtnStyle(false)}>
                {artistsCopied ? "copied!" : "[ copy all artist names ]"}
              </button>
            </div>
          ) : null}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
            <colgroup>
              <col />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr style={{ background: HEADER_BG }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>artist</th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>tracks</th>
              </tr>
            </thead>
            <tbody>
              {artistsInPlaylist.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: "12px", border: `1px solid ${BORDER}`, color: "#888", fontSize: 13 }}>
                    no artists yet
                  </td>
                </tr>
              ) : (
                artistsInPlaylist.map((artist) => (
                  <tr key={artist.name} style={{ background: "white" }}>
                    <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}` }}>{artist.name}</td>
                    <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center" }}>{artist.trackCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      ) : null}

      {activeTab === "songs" ? (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="search"
              value={songSearch}
              onChange={(e) => { setSongSearch(e.target.value); setSelected(new Set()) }}
              placeholder="track or artist name"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                fontSize: 14,
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                outline: "none",
                color: PURPLE,
                background: "white",
              }}
            />
          </div>
          {songSearch.trim() ? (
            <p style={{ margin: "0 0 0.75rem", fontSize: 13, color: "#888" }}>
              {filteredSongs.length} of {simplifiedItems.length} songs
            </p>
          ) : null}

          {selected.size > 0 && (
            <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#888" }}>{selected.size} selected</span>
              <button onClick={() => void removeSelectedItems()} disabled={isSaving} style={actionBtnStyle(isSaving)}>
                [ remove {selected.size} ]
              </button>
              <button onClick={() => setSelected(new Set())} style={actionBtnStyle(false)}>
                [ clear ]
              </button>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 44 }} />
              <col style={{ width: 44 }} />
              <col />
              <col style={{ width: 210 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 105 }} />
              <col style={{ width: 130 }} />
            </colgroup>
            <thead>
              <tr style={{ background: HEADER_BG }}>
                <th style={{ textAlign: "center", padding: "8px 12px", border: `1px solid ${BORDER}` }}>
                  <button onClick={toggleSelectAll} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: PURPLE, width: "100%", textAlign: "center", lineHeight: 0 }}>
                    {allFilteredSelected ? <CheckboxOn style={{ width: 18, height: 18 }} /> : <Checkbox style={{ width: 18, height: 18 }} />}
                  </button>
                </th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>#</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>track</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>artist</th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE, whiteSpace: "nowrap" }}>added <ChevronDown2 style={{ width: 18, height: 18, verticalAlign: "middle" }} /></th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE, whiteSpace: "nowrap" }}>duration</th>
                <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSongs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "12px", border: `1px solid ${BORDER}`, color: "#888", fontSize: 13 }}>
                    {simplifiedItems.length === 0 ? "no songs in this playlist yet" : "no songs match your search"}
                  </td>
                </tr>
              ) : null}
              {filteredSongs.map((item) => (
                <tr key={`${item.id}-${item.itemsIndex}`} style={{ background: selected.has(item.uri) ? HEADER_BG : "white" }}>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <button onClick={() => toggleSelect(item.uri)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: PURPLE, width: "100%", textAlign: "center", lineHeight: 0 }}>
                      {selected.has(item.uri) ? <CheckboxOn style={{ width: 18, height: 18 }} /> : <Checkbox style={{ width: 18, height: 18 }} />}
                    </button>
                  </td>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center", color: "#888" }}>
                    {item.itemsIndex + 1}
                  </td>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {item.albumCoverUrl ? (
                        <Image
                          src={item.albumCoverUrl}
                          alt=""
                          width={36}
                          height={36}
                          style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 4, flexShrink: 0, background: HEADER_BG }} />
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}` }}>
                    {item.artists}
                  </td>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center", color: "#888", whiteSpace: "nowrap" }}>
                    {item.addedAt ? formatAddedAt(item.addedAt) : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center", color: "#888", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {item.durationMs != null ? formatDurationMs(item.durationMs) : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", gap: 10 }}>
                      <button
                        disabled={item.itemsIndex === 0 || isSaving}
                        onClick={async () => {
                          const from = item.itemsIndex
                          moveItemLocally(from, from - 1)
                          await saveMove(from, from - 1)
                        }}
                        style={{ ...actionBtnStyle(item.itemsIndex === 0 || isSaving), fontSize: 16 }}
                        title="move up"
                      >
                        <ChevronUp />
                      </button>
                      <button
                        disabled={item.itemsIndex === items.length - 1 || isSaving}
                        onClick={async () => {
                          const from = item.itemsIndex
                          moveItemLocally(from, from + 1)
                          await saveMove(from, from + 1)
                        }}
                        style={{ ...actionBtnStyle(item.itemsIndex === items.length - 1 || isSaving), fontSize: 16 }}
                        title="move down"
                      >
                        <ChevronDown />
                      </button>
                      <button
                        disabled={isSaving}
                        onClick={async () => { await removeItem(item.itemsIndex, item.uri) }}
                        style={{ ...actionBtnStyle(isSaving), fontSize: 15 }}
                        title="remove"
                      >
                        <Delete />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  )
}
