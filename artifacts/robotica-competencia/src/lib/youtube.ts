const YOUTUBE_ID_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/))([\w-]{11})/

export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  const match = trimmed.match(YOUTUBE_ID_RE)
  return match ? match[1] : null
}

export function youtubeEmbedUrl(videoId: string, options: { autoplay?: boolean } = {}) {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" })
  if (options.autoplay) {
    params.set("autoplay", "1")
    params.set("mute", "1") // los navegadores exigen mute para autoreproducir
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}
