import { useEffect, useState } from "react"

// TikTok no tiene API pública para el estado de un LIVE en curso: no se puede embeber como YouTube.
// Lo único que pedimos es su oEmbed (miniatura + autor) para mostrar una tarjeta; si falla, se usa
// un cartel genérico. Un clic siempre redirige a TikTok, nunca reproduce adentro.

export type TikTokOEmbed = { thumbnailUrl: string | null; authorName: string | null; title: string | null }

const cache = new Map<string, Promise<TikTokOEmbed | null>>()

function fetchTikTokOEmbed(url: string): Promise<TikTokOEmbed | null> {
  if (!cache.has(url)) {
    const promise = fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => data ? { thumbnailUrl: data.thumbnail_url ?? null, authorName: data.author_name ?? null, title: data.title ?? null } : null)
      .catch(() => null)
    cache.set(url, promise)
  }
  return cache.get(url)!
}

export function useTikTokThumbnail(url: string | null): TikTokOEmbed | null {
  const [data, setData] = useState<TikTokOEmbed | null>(null)
  useEffect(() => {
    setData(null)
    if (!url) return
    let cancelled = false
    void fetchTikTokOEmbed(url).then(result => { if (!cancelled) setData(result) })
    return () => { cancelled = true }
  }, [url])
  return data
}
