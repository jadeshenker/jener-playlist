import Image from "next/image"
import Link from "next/link"
import { spotifyThumbnailUrl } from "@/lib/spotify-images"

type Playlist = {
  id: string
  name: string
  tracks?: {
    total: number
  }
  public?: boolean | null
  images?: { url: string; height?: number | null; width?: number | null }[]
}

export default function PlaylistList({ playlists }: { playlists: Playlist[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "grid", gap: 12 }}>
      {playlists.map((playlist) => {
        const coverUrl = spotifyThumbnailUrl(playlist.images)

        return (
          <li
            key={playlist.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "white",
              padding: "1rem",
            }}
          >
            <Link
              href={`/playlists/${playlist.id}`}
              style={{ display: "flex", alignItems: "center", gap: 14, color: "inherit", textDecoration: "none" }}
            >
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt=""
                  width={56}
                  height={56}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    objectFit: "cover",
                    flexShrink: 0,
                    background: "#eee",
                  }}
                />
              ) : null}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{playlist.name}</div>
                <div style={{ marginTop: 6, fontSize: 14, color: "#555" }}>
                  {playlist.tracks?.total ?? 0} tracks · {playlist.public ? "public" : "private"}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
