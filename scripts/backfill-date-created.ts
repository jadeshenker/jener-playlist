import { sql, eq } from "drizzle-orm"
import { db } from "../lib/db/index"
import { playlists, playlistVersions, playlistItems } from "../lib/db/schema"

const OVERRIDES: Record<string, string> = {
  "4KVoTfuOy5plZd0jKVx8qs": "2025-04-01",
}

async function main() {
  const allPlaylists = await db.select({ id: playlists.id, name: playlists.name }).from(playlists)
  console.log(`Processing ${allPlaylists.length} playlists...\n`)

  for (const playlist of allPlaylists) {
    const override = OVERRIDES[playlist.id]
    if (override) {
      await db.update(playlists).set({ dateCreated: override }).where(eq(playlists.id, playlist.id))
      console.log(`  ✓ ${playlist.name} → ${override} (override)`)
      continue
    }

    const result = await db
      .select({ minAddedAt: sql<string | null>`MIN(${playlistItems.addedAt})` })
      .from(playlistItems)
      .innerJoin(playlistVersions, eq(playlistItems.versionId, playlistVersions.id))
      .where(eq(playlistVersions.playlistId, playlist.id))
      .get()

    const minAddedAt = result?.minAddedAt
    if (!minAddedAt) {
      console.log(`  — ${playlist.name}: no items, skipping`)
      continue
    }

    const dateCreated = minAddedAt.substring(0, 10)
    await db.update(playlists).set({ dateCreated }).where(eq(playlists.id, playlist.id))
    console.log(`  ✓ ${playlist.name} → ${dateCreated}`)
  }

  console.log("\nDone!")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
