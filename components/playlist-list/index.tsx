"use client"

import { ArchivedSection, PlaylistCardList, SearchInput } from "./shared"
import { usePlaylistList, type PlaylistWithMeta } from "./use-playlist-list"

export type { PlaylistWithMeta }

export default function PlaylistList({
  playlists: initial,
  showActions = true,
}: {
  playlists: PlaylistWithMeta[]
  showActions?: boolean
}) {
  const {
    query,
    setQuery,
    sorted,
    archived,
    archivedOpen,
    toggleArchivedOpen,
    onTogglePin,
    onToggleArchive,
  } = usePlaylistList(initial)

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      <PlaylistCardList
        playlists={sorted}
        showActions={showActions}
        onTogglePin={onTogglePin}
        onToggleArchive={onToggleArchive}
      />
      {showActions && archived.length > 0 && (
        <ArchivedSection open={archivedOpen} count={archived.length} onToggle={toggleArchivedOpen}>
          <PlaylistCardList
            playlists={archived}
            showActions={showActions}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
          />
        </ArchivedSection>
      )}
    </div>
  )
}
