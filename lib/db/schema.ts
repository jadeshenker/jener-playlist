import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"

export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(), // Spotify playlist ID
  name: text("name").notNull(),
  latestSnapshotId: text("latest_snapshot_id"),
  pinned: integer("pinned").notNull().default(0),
  archived: integer("archived").notNull().default(0),
  dateCreated: text("date_created"), // YYYY-MM-DD, nullable
  createdAt: integer("created_at").notNull(), // unix ms
  updatedAt: integer("updated_at").notNull(), // unix ms
})

export const playlistVersions = sqliteTable(
  "playlist_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playlistId: text("playlist_id")
      .notNull()
      .references(() => playlists.id),
    major: integer("major").notNull(),
    minor: integer("minor").notNull(),
    snapshotId: text("snapshot_id").notNull(),
    contentHash: text("content_hash").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    note: text("note"),
    createdAt: integer("created_at").notNull(), // unix ms
  },
  (t) => [unique().on(t.playlistId, t.major, t.minor)]
)

export const playlistItems = sqliteTable("playlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  versionId: integer("version_id")
    .notNull()
    .references(() => playlistVersions.id),
  position: integer("position").notNull(), // 0-indexed
  trackId: text("track_id").notNull(),
  trackUri: text("track_uri").notNull(),
  trackName: text("track_name").notNull(),
  durationMs: integer("duration_ms"),
  artists: text("artists"), // comma-separated
  addedAt: text("added_at"), // ISO string from Spotify
})
