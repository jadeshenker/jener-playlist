import Link from "next/link"
import { ChevronRight } from "pixelarticons/react"
import { SignInButton } from "@/components/auth-button"

export default function LoginPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: "3rem 1.5rem",
        gap: "10px",
      }}
    >
      <Link
        href="/playlists"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          fontSize: 13,
          textDecoration: "none",
          position: "fixed",
          top: "1.25rem",
          right: "1.25rem",
        }}
      >
        [ continue without logging in <ChevronRight style={{ width: 14, height: 14 }} /> ]
      </Link>
      <p>₍^. .^₎⟆</p>
      <SignInButton />
      <p
        style={{
          fontSize: "13px",
        }}
      >
        not{" "}
        <a href="https://github.com/jadeshenker/" target="_blank">
          jade
        </a>
        ? noprob you can love music too.{" "}
        <a href="https://github.com/jadeshenker/jener-playlist/" target="_blank">
          fork
        </a>{" "}
        and make your own 🌝
      </p>
    </main>
  )
}
