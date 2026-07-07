import Link from "next/link"
import { ChevronRight } from "pixelarticons/react"
import { SignInButton } from "@/components/auth-button"

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-[960px] flex-1 flex-col items-center justify-center gap-2.5 px-6 py-12">
      <Link
        href="/playlists"
        className="fixed top-5 right-5 inline-flex items-center gap-0.5 text-[13px] text-[blue] no-underline"
      >
        [ continue without logging in <ChevronRight className="h-3.5 w-3.5" /> ]
      </Link>
      <p>₍^. .^₎⟆</p>
      <SignInButton />
      <p className="text-[13px]">
        not{" "}
        <a href="https://github.com/jadeshenker/" target="_blank" className="text-[blue] underline">
          jade
        </a>
        ? noprob you can love music too.{" "}
        <a
          href="https://github.com/jadeshenker/jener-playlist/"
          target="_blank"
          className="text-[blue] underline"
        >
          fork
        </a>{" "}
        and make your own 🌝
      </p>
    </main>
  )
}
