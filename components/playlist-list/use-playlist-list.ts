"use client"

import { useState } from "react"

export type PlaylistWithMeta = {
  id: string
  name: string
  coverUrl?: string | null
  trackCount?: number | null
  pinned: boolean
  archived: boolean
  dateCreated?: string | null
}

async function patchMeta(
  playlistId: string,
  name: string,
  patch: { pinned?: boolean; archived?: boolean }
) {
  await fetch(`/api/playlists/${playlistId}/meta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...patch }),
  })
}

export function usePlaylistList(initial: PlaylistWithMeta[]) {
  const [playlists, setPlaylists] = useState(initial)
  const [query, setQuery] = useState("")
  const [archivedOpen, setArchivedOpen] = useState(false)

  const toggle = (id: string, name: string, patch: { pinned?: boolean; archived?: boolean }) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    patchMeta(id, name, patch)
  }

  const q = query.trim().toLowerCase()
  const active = playlists.filter((p) => !p.archived && (!q || p.name.toLowerCase().includes(q)))
  const archived = playlists.filter((p) => p.archived && (!q || p.name.toLowerCase().includes(q)))
  const sorted = [...active.filter((p) => p.pinned), ...active.filter((p) => !p.pinned)]

  return {
    query,
    setQuery,
    archivedOpen,
    toggleArchivedOpen: () => setArchivedOpen((v) => !v),
    sorted,
    archived,
    onTogglePin: (id: string, name: string, current: boolean) =>
      toggle(id, name, { pinned: !current }),
    onToggleArchive: (id: string, name: string, current: boolean) =>
      toggle(id, name, { archived: !current }),
  }
}

export type PlaylistListState = ReturnType<typeof usePlaylistList>
