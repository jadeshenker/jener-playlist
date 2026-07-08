"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type SyncState = "idle" | "syncing" | "done" | "error" | "reauth"

export default function SyncButton({ playlistId }: { playlistId?: string }) {
  const [state, setState] = useState<SyncState>("idle")
  const router = useRouter()

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
      router.refresh()
      setTimeout(() => setState("idle"), 4000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 4000)
    }
  }

  const isSingle = Boolean(playlistId)

  return (
    <>
      <button onClick={handleSync} disabled={state === "syncing"} className="btn-outline">
        {state === "syncing" ? "syncing…" : isSingle ? "sync" : "sync all"}
      </button>
      {state !== "idle" && (
        <div className="fixed right-4 bottom-4 z-50 border border-[blue] bg-white px-3 py-2 text-[13px] leading-normal text-[blue]">
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
