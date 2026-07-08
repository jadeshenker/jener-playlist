"use client"

import { useState } from "react"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"
import type { SpotifySavedTrack } from "@/lib/spotify"

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
  }
}

export type LikedSongsState = ReturnType<typeof useLikedSongs>
