"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { formatAddedAt } from "@/lib/format"
import { ChevronDown, ChevronDown2, ChevronRight } from 'pixelarticons/react'

const PURPLE = "#6d28d9"
const BORDER = "#c4b5fd"
const HEADER_BG = "#ede9fe"

export type PlaylistWithMeta = {
  id: string
  name: string
  coverUrl?: string | null
  trackCount?: number | null
  pinned: boolean
  archived: boolean
  dateCreated?: string | null
}

async function patchMeta(playlistId: string, name: string, patch: { pinned?: boolean; archived?: boolean }) {
  await fetch(`/api/playlists/${playlistId}/meta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...patch }),
  })
}

function PlaylistTable({
  playlists,
  onTogglePin,
  onToggleArchive,
}: {
  playlists: PlaylistWithMeta[]
  onTogglePin: (id: string, name: string, current: boolean) => void
  onToggleArchive: (id: string, name: string, current: boolean) => void
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
      <colgroup>
        <col />
        <col style={{ width: 80 }} />
        <col style={{ width: 130 }} />
        <col style={{ width: 200 }} />
      </colgroup>
      <thead>
        <tr style={{ background: HEADER_BG }}>
          <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>playlist</th>
          <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>tracks</th>
          <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>created <ChevronDown2 style={{ width: 18, height: 18, verticalAlign: "middle" }} /></th>
          <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 500, border: `1px solid ${BORDER}`, color: PURPLE }}>actions</th>
        </tr>
      </thead>
      <tbody>
        {playlists.map((playlist) => (
          <tr key={playlist.id} style={{ background: "white" }}>
            <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}` }}>
              <Link
                href={`/playlists/${playlist.id}`}
                style={{ display: "flex", alignItems: "center", gap: 10, color: PURPLE, textDecoration: "underline" }}
              >
                {playlist.coverUrl ? (
                  <Image
                    src={playlist.coverUrl}
                    alt=""
                    width={36}
                    height={36}
                    style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : null}
                <span>
                  {playlist.pinned ? <span style={{ marginRight: 4, fontSize: 12 }}>📌</span> : null}
                  {playlist.name}
                </span>
              </Link>
            </td>
            <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center" }}>
              {playlist.trackCount ?? 0}
            </td>
            <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center", color: "#888", whiteSpace: "nowrap" }}>
              {playlist.dateCreated ? formatAddedAt(playlist.dateCreated) : "—"}
            </td>
            <td style={{ padding: "8px 12px", border: `1px solid ${BORDER}`, textAlign: "center", whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-flex", gap: 8 }}>
                <button
                  onClick={() => onTogglePin(playlist.id, playlist.name, playlist.pinned)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: PURPLE, textDecoration: "underline", padding: 0, font: "inherit", fontSize: 13 }}
                >
                  {playlist.pinned ? "[ unpin ]" : "[ pin ]"}
                </button>
                <button
                  onClick={() => onToggleArchive(playlist.id, playlist.name, playlist.archived)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: PURPLE, textDecoration: "underline", padding: 0, font: "inherit", fontSize: 13 }}
                >
                  {playlist.archived ? "[ unarchive ]" : "[ archive ]"}
                </button>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function PlaylistList({ playlists: initial }: { playlists: PlaylistWithMeta[] }) {
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

  return (
    <div>
      <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
        <input
          type="search"
          placeholder="search playlists"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            fontSize: 14,
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            outline: "none",
            color: PURPLE,
            background: "white",
          }}
        />
      </div>

      <PlaylistTable
        playlists={sorted}
        onTogglePin={(id, name, current) => toggle(id, name, { pinned: !current })}
        onToggleArchive={(id, name, current) => toggle(id, name, { archived: !current })}
      />

      {archived.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setArchivedOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 12, fontFamily: "inherit", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}
          >
            {archivedOpen
              ? <ChevronDown style={{ width: 16, height: 16 }} />
              : <ChevronRight style={{ width: 16, height: 16 }} />}
            view archived ({archived.length})
          </button>
          {archivedOpen && (
            <div style={{ marginTop: 12 }}>
              <PlaylistTable
                playlists={archived}
                onTogglePin={(id, name, current) => toggle(id, name, { pinned: !current })}
                onToggleArchive={(id, name, _current) => toggle(id, name, { archived: false })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
