import { signIn, signOut } from "@/lib/auth"

export async function SignInButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("spotify", { redirectTo: "/playlists" })
      }}
    >
      <button
        style={{
          padding: "0.75rem 1rem",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "white",
          cursor: "pointer",
        }}
      >
        continue with spotify
      </button>
    </form>
  )
}

export async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}
    >
      <button
        style={{
          fontSize: 13,
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
          color: "#555",
        }}
      >
        sign out
      </button>
    </form>
  )
}
