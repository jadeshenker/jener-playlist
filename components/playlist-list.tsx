import Link from "next/link"

type Playlist = {
  id: string
  name: string
  tracks?: {
    total: number
  }
  public?: boolean | null
}

export default function PlaylistList({ playlists }: { playlists: Playlist[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "grid", gap: 12 }}>
      {playlists.map((playlist) => (
        <li
          key={playlist.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "white",
            padding: "1rem",
          }}
        >
          <Link href={`/playlists/${playlist.id}`} style={{ display: "block" }}>
            <div style={{ fontWeight: 600 }}>{playlist.name}</div>
            <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
              {playlist.tracks?.total ?? 0} tracks · {playlist.public ? "public" : "private"}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
