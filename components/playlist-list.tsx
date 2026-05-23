"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"

export type PlaylistWithMeta = {
  id: string
  name: string
  tracks?: { total: number }
  public?: boolean | null
  images?: { url: string; height?: number | null; width?: number | null }[]
  pinned: boolean
  archived: boolean
}

async function patchMeta(playlistId: string, name: string, patch: { pinned?: boolean; archived?: boolean }) {
  await fetch(`/api/playlists/${playlistId}/meta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...patch }),
  })
}

function PlaylistRow({
  playlist,
  onTogglePin,
  onToggleArchive,
}: {
  playlist: PlaylistWithMeta
  onTogglePin: () => void
  onToggleArchive: () => void
}) {
  const coverUrl = spotifyThumbnailUrl(playlist.images)

  return (
    <li
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        background: "white",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <Link
        href={`/playlists/${playlist.id}`}
        style={{ display: "flex", alignItems: "center", gap: 14, color: "inherit", textDecoration: "none", flex: 1, minWidth: 0 }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            width={56}
            height={56}
            style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "#eee" }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>
            {playlist.pinned ? <span style={{ marginRight: 6, fontSize: 13 }}>📌</span> : null}
            {playlist.name}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
            {playlist.tracks?.total ?? 0} tracks · {playlist.public ? "public" : "private"}
          </div>
        </div>
      </Link>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onTogglePin}
          style={{
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: playlist.pinned ? "#f0f0f0" : "white",
            cursor: "pointer",
            color: "#555",
          }}
        >
          {playlist.pinned ? "unpin" : "pin"}
        </button>
        <button
          onClick={onToggleArchive}
          style={{
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: playlist.archived ? "#f0f0f0" : "white",
            cursor: "pointer",
            color: "#555",
          }}
        >
          {playlist.archived ? "unarchive" : "archive"}
        </button>
      </div>
    </li>
  )
}

export default function PlaylistList({ playlists: initial }: { playlists: PlaylistWithMeta[] }) {
  const [playlists, setPlaylists] = useState(initial)

  const toggle = (id: string, name: string, patch: { pinned?: boolean; archived?: boolean }) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    patchMeta(id, name, patch)
  }

  const active = playlists.filter((p) => !p.archived)
  const archived = playlists.filter((p) => p.archived)
  const sorted = [...active.filter((p) => p.pinned), ...active.filter((p) => !p.pinned)]

  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "grid", gap: 12 }}>
        {sorted.map((playlist) => (
          <PlaylistRow
            key={playlist.id}
            playlist={playlist}
            onTogglePin={() => toggle(playlist.id, playlist.name, { pinned: !playlist.pinned })}
            onToggleArchive={() => toggle(playlist.id, playlist.name, { archived: !playlist.archived })}
          />
        ))}
      </ul>

      {archived.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: "pointer", color: "#888", fontSize: 14, userSelect: "none", padding: "4px 0" }}>
            view archived ({archived.length})
          </summary>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 12 }}>
            {archived.map((playlist) => (
              <PlaylistRow
                key={playlist.id}
                playlist={playlist}
                onTogglePin={() => toggle(playlist.id, playlist.name, { pinned: !playlist.pinned })}
                onToggleArchive={() => toggle(playlist.id, playlist.name, { archived: false })}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
