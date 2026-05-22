import path from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.scdn.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.spotifycdn.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    turbo: {
      // Avoid picking a parent lockfile (e.g. ~/package-lock.json) as the workspace root
      root: projectRoot,
    },
  },
}

export default nextConfig
