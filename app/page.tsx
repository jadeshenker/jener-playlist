import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignInButton } from "@/components/auth-button"

export default async function HomePage() {
  const session = await auth()

  if (session) {
    redirect("/playlists")
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0, letterSpacing: "0.02em" }}>1-800-I-LOVE-MUSIC</h1>
      <SignInButton />
    </main>
  )
}
