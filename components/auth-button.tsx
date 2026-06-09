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
        className="contained"
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
        className="contained"
      >
        sign out
      </button>
    </form>
  )
}
