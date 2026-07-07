import { signIn, signOut } from "@/lib/auth"

export async function SignInButton({ label = "continue with spotify" }: { label?: string } = {}) {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("spotify", { redirectTo: "/playlists" })
      }}
    >
      <button className="btn-outline">{label}</button>
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
      <button className="btn-outline">sign out</button>
    </form>
  )
}
