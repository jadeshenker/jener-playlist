import { SignInButton } from "@/components/auth-button"

export default function LoginPage() {
  return (
    <main style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh", 
    padding: "3rem 1.5rem" }}>
      <div style={{display: "flex"}}>
        <p style={{marginLeft: '4px'}}>₍^. .^₎⟆</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <SignInButton />
      </div>
    </main>
  )
}
