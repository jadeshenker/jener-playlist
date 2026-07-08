"use client"

import { useState } from "react"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import type { SpotifySavedTrack } from "@/lib/spotify"
import { useSelection, type SelectedSong } from "@/components/selection/selection-context"

export function useLikedSongs({
  initialItems,
  initialTotal,
  limit = 50,
}: {
  initialItems: SpotifySavedTrack[]
  initialTotal: number
  limit?: number
}) {
  const [items, setItems] = useState(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastClickedUri, setLastClickedUri] = useState<string | null>(null)
  const selection = useSelection()

  const simplifiedItems = items
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
    }))

  const selected = new Set(
    simplifiedItems.filter((item) => selection.isSelected(item.uri)).map((item) => item.uri)
  )

  const allSelected = simplifiedItems.length > 0 && simplifiedItems.every((item) => selected.has(item.uri))

  const toSelectedSong = (item: (typeof simplifiedItems)[number]): SelectedSong => ({
    uri: item.uri,
    id: item.id,
    name: item.name,
    artists: item.artists,
    albumCoverUrl: item.albumCoverUrl,
    durationMs: item.durationMs,
    source: { type: "liked-songs" },
  })

  const toggleSelect = (uri: string, shiftKey = false) => {
    if (shiftKey && lastClickedUri) {
      const startIndex = simplifiedItems.findIndex((item) => item.uri === lastClickedUri)
      const endIndex = simplifiedItems.findIndex((item) => item.uri === uri)
      if (startIndex !== -1 && endIndex !== -1) {
        const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
        selection.selectMany(simplifiedItems.slice(from, to + 1).map(toSelectedSong))
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
    if (allSelected) {
      selection.deselectMany(simplifiedItems.map((item) => item.uri))
    } else {
      selection.selectMany(simplifiedItems.map(toSelectedSong))
    }
  }

  async function loadPage(nextOffset: number) {
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/me/tracks?limit=${limit}&offset=${nextOffset}`)
      if (!response.ok) throw new Error("Failed to load liked songs")
      const data = (await response.json()) as {
        items: SpotifySavedTrack[]
        total: number
        offset: number
      }
      setItems(data.items)
      setTotal(data.total)
      setOffset(data.offset)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const hasPrev = offset > 0
  const hasNext = offset + limit < total

  return {
    total,
    offset,
    limit,
    isLoading,
    error,
    simplifiedItems,
    hasPrev,
    hasNext,
    nextPage: () => loadPage(offset + limit),
    prevPage: () => loadPage(Math.max(offset - limit, 0)),
    selected,
    allSelected,
    toggleSelect,
    toggleSelectAll,
  }
}

export type LikedSongsState = ReturnType<typeof useLikedSongs>
