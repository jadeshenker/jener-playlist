import { SignInButton } from "@/components/auth-button"

export default function LoginPage() {
  return (
    <main style={{ 
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "3rem 1.5rem",
      gap: "10px" }}>
        <p>₍^. .^₎⟆</p>
        <SignInButton />
        <p style={{
          fontSize: "13px"
        }}>not <a href="https://github.com/jadeshenker/" target="_blank">jade</a>? noprob you can love music too. <a href="https://github.com/jadeshenker/jener-playlist/" target="_blank">fork</a> and make your own 🌝</p>
    </main>
  )
}
