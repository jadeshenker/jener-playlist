import { SignInButton } from "@/components/auth-button"

export default function LoginPage() {
  return (
    <main style={{ padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>login</h1>
      <p style={{ color: "#555", marginTop: 12 }}>
        connect your spotify account to edit your playlists.
      </p>
      <div style={{ marginTop: 24 }}>
        <SignInButton />
      </div>
    </main>
  )
}
