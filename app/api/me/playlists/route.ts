import { NextResponse } from "next/server"
import { fetchMyOwnedPlaylists } from "@/lib/spotify"

export async function GET() {
  const data = await fetchMyOwnedPlaylists(50)
  return NextResponse.json(data)
}
