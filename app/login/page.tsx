import { SignInButton } from "@/components/auth-button"

export default function LoginPage() {
  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: 18, margin: 0 }}>welcome back ₍^. .^₎⟆</h1>
      <div style={{ marginTop: 24 }}>
        <SignInButton />
      </div>
    </main>
  )
}
