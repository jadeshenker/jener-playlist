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
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
})
