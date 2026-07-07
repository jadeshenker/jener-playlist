"use client"

import { useEffect, useState } from "react"
import { usePlaylistEditor, type PlaylistItem } from "./use-playlist-editor"
import PlaylistEditorDesktop from "./desktop"
import PlaylistEditorMobile from "./mobile"

export type { PlaylistItem }

export default function PlaylistEditor({
  playlistId,
  initialItems,
  initialSnapshotId,
  readOnly = false,
}: {
  playlistId: string
  initialItems: PlaylistItem[]
  initialSnapshotId?: string
  readOnly?: boolean
}) {
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 900)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const editor = usePlaylistEditor({ playlistId, initialItems, initialSnapshotId })

  return isNarrow ? (
    <PlaylistEditorMobile editor={editor} readOnly={readOnly} />
  ) : (
    <PlaylistEditorDesktop editor={editor} readOnly={readOnly} />
  )
}
