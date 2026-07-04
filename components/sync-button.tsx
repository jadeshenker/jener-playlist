"use client"

import { useState } from "react"

type SyncState = "idle" | "syncing" | "done" | "error" | "reauth"

export default function SyncButton({ playlistId }: { playlistId?: string }) {
  const [state, setState] = useState<SyncState>("idle")

  async function handleSync() {
    if (state === "syncing") return
    setState("syncing")
    try {
      const res = await fetch("/api/cron/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playlistId ? { playlistId } : {}),
      })
      if (res.status === 401) {
        setState("reauth")
        return
      }
      if (!res.ok) throw new Error()
      setState("done")
      setTimeout(() => setState("idle"), 4000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 4000)
    }
  }

  const isSingle = Boolean(playlistId)

  return (
    <>
      <button onClick={handleSync} disabled={state === "syncing"} className="contained">
        {state === "syncing" ? "syncing…" : isSingle ? "sync" : "sync all"}
      </button>
      {state !== "idle" && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            padding: "0.5rem 0.75rem",
            border: "1px solid blue",
            background: "white",
            color: "blue",
            fontSize: 13,
            lineHeight: 1.5,
            zIndex: 50,
          }}
        >
          {state === "syncing" &&
            (isSingle
              ? "syncing playlist — please don't close the page"
              : "syncing playlists — please don't close the page")}
          {state === "done" && "sync complete"}
          {state === "error" && "sync failed — try again"}
          {state === "reauth" && "session expired — sign out and sign back in"}
        </div>
      )}
    </>
  )
}
