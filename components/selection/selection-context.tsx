"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type SelectedSong = {
  uri: string
  id: string
  name: string
  artists: string
  albumCoverUrl?: string
  durationMs?: number
  source: { type: "playlist"; playlistId: string } | { type: "liked-songs" }
}

type SelectionContextValue = {
  selected: SelectedSong[]
  isSelected: (uri: string) => boolean
  toggle: (song: SelectedSong) => void
  selectMany: (songs: SelectedSong[]) => void
  deselectMany: (uris: string[]) => void
  remove: (uri: string) => void
  clear: () => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map<string, SelectedSong>>(new Map())

  const isSelected = useCallback((uri: string) => map.has(uri), [map])

  const toggle = useCallback((song: SelectedSong) => {
    setMap((prev) => {
      const next = new Map(prev)
      if (next.has(song.uri)) next.delete(song.uri)
      else next.set(song.uri, song)
      return next
    })
  }, [])

  const selectMany = useCallback((songs: SelectedSong[]) => {
    setMap((prev) => {
      const next = new Map(prev)
      for (const song of songs) next.set(song.uri, song)
      return next
    })
  }, [])

  const deselectMany = useCallback((uris: string[]) => {
    setMap((prev) => {
      const next = new Map(prev)
      for (const uri of uris) next.delete(uri)
      return next
    })
  }, [])

  const remove = useCallback((uri: string) => {
    setMap((prev) => {
      const next = new Map(prev)
      next.delete(uri)
      return next
    })
  }, [])

  const clear = useCallback(() => setMap(new Map()), [])

  const value = useMemo<SelectionContextValue>(
    () => ({
      selected: [...map.values()],
      isSelected,
      toggle,
      selectMany,
      deselectMany,
      remove,
      clear,
    }),
    [map, isSelected, toggle, selectMany, deselectMany, remove, clear]
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function useSelection() {
  const context = useContext(SelectionContext)
  if (!context) throw new Error("useSelection must be used within a SelectionProvider")
  return context
}
