import { NextRequest, NextResponse } from "next/server"
import { fetchLikedSongsPage } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 50)
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0)
  const data = await fetchLikedSongsPage(limit, offset)
  return NextResponse.json(data)
}
