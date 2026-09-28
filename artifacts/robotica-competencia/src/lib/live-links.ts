export type StreamProvider = "youtube" | "tiktok"

function hostnameOf(input: string): string | null {
  try {
    return new URL(input.includes("://") ? input : `https://${input}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function detectStreamProvider(input: string): StreamProvider | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^[\w-]{11}$/.test(trimmed)) return "youtube" // ID crudo de YouTube, sin URL
  const host = hostnameOf(trimmed)
  if (!host) return null
  if (host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com") return "youtube"
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok"
  return null
}
