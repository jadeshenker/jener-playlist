"use client"

import { useEffect, useState } from "react"
import type { SpotifySavedTrack } from "@/lib/spotify"
import { useLikedSongs } from "./use-liked-songs"
import LikedSongsDesktop from "./desktop"
import LikedSongsMobile from "./mobile"

export default function LikedSongs({
  initialItems,
  initialTotal,
}: {
  initialItems: SpotifySavedTrack[]
  initialTotal: number
}) {
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 750)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const state = useLikedSongs({ initialItems, initialTotal })

  return isNarrow ? <LikedSongsMobile state={state} /> : <LikedSongsDesktop state={state} />
}
