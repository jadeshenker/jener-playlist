import { getToken } from "next-auth/jwt"
import { type NextRequest } from "next/server"

// One-time helper: visit /api/auth/token while logged in to get your refresh token.
// Copy the value into .env.local as SPOTIFY_REFRESH_TOKEN, then you can delete this file.
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  if (!token?.refreshToken) {
    return new Response("Unauthorized — log in first", { status: 401 })
  }
  return Response.json({ refreshToken: token.refreshToken })
}
