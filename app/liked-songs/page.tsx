import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "pixelarticons/react"
import LikedSongs from "@/components/liked-songs"
import { SignOutButton } from "@/components/auth-button"
import { auth } from "@/lib/auth"
import { fetchLikedSongsPage } from "@/lib/spotify"

export default async function LikedSongsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { items, total } = await fetchLikedSongsPage(50, 0)

  return (
    <main className="mx-auto w-full max-w-[960px] px-6 pt-8 pb-12 max-[650px]:px-0 max-[650px]:pt-4 max-[650px]:pb-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2 max-[650px]:px-3">
        <Link
          href="/playlists"
          className="inline-flex items-center gap-0.5 text-[13px] text-[blue] no-underline"
        >
          [ <ChevronLeft className="h-3.5 w-3.5" /> back ]
        </Link>
        <h1 className="m-0 text-lg text-[blue]">_liked_songs</h1>
        <SignOutButton />
      </div>
      <LikedSongs initialItems={items} initialTotal={total} />
    </main>
  )
}
