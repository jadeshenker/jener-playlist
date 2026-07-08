"use client"

import { useMemo, useState } from "react"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import { useSelection, type SelectedSong } from "@/components/selection/selection-context"

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

export type EditorTab = "songs" | "artists"

export function usePlaylistEditor({
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

  const [activeTab, setActiveTab] = useState<EditorTab>("songs")
  const [artistsCopied, setArtistsCopied] = useState(false)
  const [songSearch, setSongSearch] = useState("")
  const [lastClickedUri, setLastClickedUri] = useState<string | null>(null)
  const selection = useSelection()

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
      (item) =>
        item.name.toLowerCase().includes(query) || item.artists.toLowerCase().includes(query)
    )
  }, [simplifiedItems, songSearch])

  const selected = useMemo(
    () =>
      new Set(
        simplifiedItems.filter((item) => selection.isSelected(item.uri)).map((item) => item.uri)
      ),
    [simplifiedItems, selection]
  )

  const allFilteredSelected =
    filteredSongs.length > 0 && filteredSongs.every((item) => selected.has(item.uri))

  const toSelectedSong = (item: (typeof simplifiedItems)[number]): SelectedSong => ({
    uri: item.uri,
    id: item.id,
    name: item.name,
    artists: item.artists,
    albumCoverUrl: item.albumCoverUrl,
    durationMs: item.durationMs,
    source: { type: "playlist", playlistId },
  })

  const updateSongSearch = (value: string) => {
    setSongSearch(value)
    selection.deselectMany([...selected])
  }

  const clearSelected = () => selection.deselectMany(simplifiedItems.map((item) => item.uri))

  const toggleSelect = (uri: string, shiftKey = false) => {
    if (shiftKey && lastClickedUri) {
      const startIndex = filteredSongs.findIndex((item) => item.uri === lastClickedUri)
      const endIndex = filteredSongs.findIndex((item) => item.uri === uri)
      if (startIndex !== -1 && endIndex !== -1) {
        const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
        selection.selectMany(filteredSongs.slice(from, to + 1).map(toSelectedSong))
        setLastClickedUri(uri)
        return
      }
    }

    const item = simplifiedItems.find((item) => item.uri === uri)
    if (!item) return
    selection.toggle(toSelectedSong(item))
    setLastClickedUri(uri)
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      selection.deselectMany(filteredSongs.map((item) => item.uri))
    } else {
      selection.selectMany(filteredSongs.map(toSelectedSong))
    }
  }

  async function moveSelectedUp() {
    if (selected.size === 0) return
    const selectedItems = simplifiedItems
      .filter((item) => selected.has(item.uri))
      .sort((a, b) => a.itemsIndex - b.itemsIndex)
    if (selectedItems.length === 0) return

    const occupied = new Set(selectedItems.map((item) => item.itemsIndex))
    const moves: { from: number; to: number }[] = []
    for (const item of selectedItems) {
      const from = item.itemsIndex
      const to = from - 1
      if (to < 0 || occupied.has(to)) continue
      moves.push({ from, to })
      occupied.delete(from)
      occupied.add(to)
    }
    if (moves.length === 0) return

    setItems((prev) => {
      const next = [...prev]
      for (const { from, to } of moves) {
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
      }
      return next
    })
    setError(null)
    setIsSaving(true)
    try {
      let currentSnapshotId = snapshotId
      for (const { from, to } of moves) {
        const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            range_start: from,
            insert_before: to,
            range_length: 1,
            snapshot_id: currentSnapshotId,
          }),
        })
        if (!response.ok) throw new Error("Failed to reorder")
        const data = await response.json()
        currentSnapshotId = data.snapshot_id
      }
      setSnapshotId(currentSnapshotId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function moveSelectedDown() {
    if (selected.size === 0) return
    const selectedItems = simplifiedItems
      .filter((item) => selected.has(item.uri))
      .sort((a, b) => b.itemsIndex - a.itemsIndex)
    if (selectedItems.length === 0) return

    const occupied = new Set(selectedItems.map((item) => item.itemsIndex))
    const moves: { from: number; to: number }[] = []
    for (const item of selectedItems) {
      const from = item.itemsIndex
      const to = from + 1
      if (to >= items.length || occupied.has(to)) continue
      moves.push({ from, to })
      occupied.delete(from)
      occupied.add(to)
    }
    if (moves.length === 0) return

    setItems((prev) => {
      const next = [...prev]
      for (const { from, to } of moves) {
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
      }
      return next
    })
    setError(null)
    setIsSaving(true)
    try {
      let currentSnapshotId = snapshotId
      for (const { from, to } of moves) {
        const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            range_start: from,
            insert_before: to + 1,
            range_length: 1,
            snapshot_id: currentSnapshotId,
          }),
        })
        if (!response.ok) throw new Error("Failed to reorder")
        const data = await response.json()
        currentSnapshotId = data.snapshot_id
      }
      setSnapshotId(currentSnapshotId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
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
        body: JSON.stringify({
          range_start: from,
          insert_before: insertBefore,
          range_length: 1,
          snapshot_id: snapshotId,
        }),
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
      selection.deselectMany(toRemove)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  async function addSelectedSongsAfter(afterIndex: number) {
    const songs = selection.selected
    if (songs.length === 0) return 0

    setError(null)
    setIsSaving(true)
    try {
      const position = afterIndex + 1
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: songs.map((song) => song.uri), position }),
      })
      if (!response.ok) throw new Error("Failed to add tracks")
      const data = await response.json()
      setSnapshotId(data.snapshot_id)

      const newItems: PlaylistItem[] = songs.map((song) => ({
        added_at: new Date().toISOString(),
        track: {
          id: song.id,
          uri: song.uri,
          name: song.name,
          duration_ms: song.durationMs,
          artists: [{ name: song.artists }],
          album: song.albumCoverUrl ? { images: [{ url: song.albumCoverUrl }] } : undefined,
        },
      }))
      setItems((prev) => [...prev.slice(0, position), ...newItems, ...prev.slice(position)])
      return songs.length
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      return 0
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

  return {
    items,
    isSaving,
    error,
    activeTab,
    setActiveTab,
    artistsCopied,
    songSearch,
    updateSongSearch,
    selected,
    toggleSelect,
    toggleSelectAll,
    clearSelected,
    simplifiedItems,
    filteredSongs,
    allFilteredSelected,
    moveSelectedUp,
    moveSelectedDown,
    artistsInPlaylist,
    moveItemLocally,
    saveMove,
    removeItem,
    removeSelectedItems,
    addSelectedSongsAfter,
    copyArtistNames,
  }
}

export type PlaylistEditorState = ReturnType<typeof usePlaylistEditor>
