import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth()
  const offline = Boolean(process.env.OFFLINE)

  if (session || offline) {
    redirect("/playlists")
  } else {
    redirect("/login")
  }
}
