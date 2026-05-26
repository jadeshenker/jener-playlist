import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

/** Base URL for Auth.js routes (`/api/auth`). Used so OAuth `redirect_uri` matches Spotify even when the browser uses a different host (e.g. `localhost` vs `127.0.0.1`). */
const authBaseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
const redirectProxyUrl = authBaseUrl
  ? new URL("/api/auth", authBaseUrl).toString().replace(/\/$/, "")
  : undefined

/**
 * After OAuth, Auth.js resolves `callbackUrl` using the request `baseUrl`. If the cookie still
 * mentions `localhost` but `AUTH_URL` is `127.0.0.1` (or vice versa), the default callback can
 * send users to the wrong host. Pin redirects to `AUTH_URL` / `NEXTAUTH_URL` when set.
 */
function authRedirect({ url, baseUrl }: { url: string; baseUrl: string }) {
  if (!authBaseUrl) {
    if (url.startsWith("/")) return `${baseUrl}${url}`
    try {
      if (new URL(url).origin === baseUrl) return url
    } catch {
      return baseUrl
    }
    return baseUrl
  }

  const origin = new URL(authBaseUrl).origin
  if (url.startsWith("/")) return `${origin}${url}`

  try {
    const u = new URL(url)
    if (u.origin === origin) return url

    const isLoopback = u.hostname === "localhost" || u.hostname === "127.0.0.1"
    const canonicalHost = new URL(origin).hostname
    const canonicalIsLoopback =
      canonicalHost === "localhost" || canonicalHost === "127.0.0.1"

    if (isLoopback && canonicalIsLoopback) {
      return `${origin}${u.pathname}${u.search}${u.hash}`
    }

    if (u.origin === baseUrl) return url
  } catch {
    return origin
  }

  return origin
}

async function refreshSpotifyToken(refreshToken: string) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.AUTH_SPOTIFY_ID}:${process.env.AUTH_SPOTIFY_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error("Spotify refresh token request failed")
  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(redirectProxyUrl ? { redirectProxyUrl } : {}),
  providers: [
    Spotify({
      authorization:
        "https://accounts.spotify.com/authorize?" +
        new URLSearchParams({
          scope: [
            "playlist-read-private",
            "playlist-modify-private",
            "playlist-modify-public",
          ].join(" "),
        }),
    }),
  ],
  callbacks: {
    redirect: authRedirect,
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        return token
      }

      if (Date.now() / 1000 < (token.expiresAt ?? 0) - 60) return token

      // Don't retry after a failed refresh — require the user to re-login
      if (token.error === "RefreshTokenError") return token

      try {
        const refreshed = await refreshSpotifyToken(token.refreshToken!)
        token.accessToken = refreshed.accessToken
        token.refreshToken = refreshed.refreshToken
        token.expiresAt = refreshed.expiresAt
        delete token.error
      } catch {
        token.error = "RefreshTokenError"
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.error = token.error
      return session
    },
  },
})
