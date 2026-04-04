import Link from "next/link"
import { auth } from "@/lib/auth"
import { SignInButton, SignOutButton } from "@/components/auth-button"

export default async function HomePage() {
  const session = await auth()

  return (
    <main style={{ padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: 32, margin: 0 }}>spotify playlist editor</h1>
      <p style={{ color: "#555", marginTop: 12, maxWidth: 620 }}>
        personal-use app for loading your spotify playlists and making simple edits.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center" }}>
        {session ? (
          <>
            <Link
              href="/playlists"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "white",
              }}
            >
              go to playlists
            </Link>
            <SignOutButton />
          </>
        ) : (
          <SignInButton />
        )}
      </div>
    </main>
  )
}
