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
          padding: "0.6rem 1.5rem",
          border: "1.5px solid #c4b5fd",
          borderRadius: 4,
          background: "#ede9fe",
          color: "#6d28d9",
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
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#6d28d9",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        [ sign out ]
      </button>
    </form>
  )
}
