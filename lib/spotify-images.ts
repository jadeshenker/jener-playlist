type SpotifyImage = {
  url: string
  height?: number | null
  width?: number | null
}

export function spotifyThumbnailUrl(
  images?: SpotifyImage[],
  minHeight = 48
): string | undefined {
  if (!images?.length) return undefined
  const sorted = [...images].sort((a, b) => (a.height ?? 0) - (b.height ?? 0))
  const usable = sorted.find((img) => (img.height ?? 0) >= minHeight) ?? sorted[sorted.length - 1]
  return usable?.url
}
