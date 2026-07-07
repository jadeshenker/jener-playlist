"use client"

import { useEffect, useState } from "react"
import { usePlaylistList, type PlaylistWithMeta } from "./use-playlist-list"
import PlaylistListDesktop from "./desktop"
import PlaylistListMobile from "./mobile"

export type { PlaylistWithMeta }

export default function PlaylistList({
  playlists: initial,
  showActions = true,
}: {
  playlists: PlaylistWithMeta[]
  showActions?: boolean
}) {
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 750)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const state = usePlaylistList(initial)

  return isNarrow ? (
    <PlaylistListMobile state={state} showActions={showActions} />
  ) : (
    <PlaylistListDesktop state={state} showActions={showActions} />
  )
}
