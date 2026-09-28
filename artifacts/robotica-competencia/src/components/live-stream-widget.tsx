import { useEffect, useState } from "react"
import { Link } from "wouter"
import { Radio, X, ChevronDown, ChevronUp, Maximize2, ExternalLink } from "lucide-react"
import { useData, type LiveStream } from "@/lib/data"
import { youtubeEmbedUrl } from "@/lib/youtube"

const DISMISS_KEY = "torneo:stream-widget-dismissed"
const isValid = (s: LiveStream) => s.provider === "youtube" ? Boolean(s.videoId) : Boolean(s.url)

/**
 * Previsualización flotante de transmisiones en vivo.
 * Sin `streams`, muestra todas las categorías activas (uso en AppLayout).
 * Con `streams`, muestra solo esas (ej. la categoría seleccionada en /bracket).
 * Solo YouTube se reproduce adentro; TikTok siempre redirige a TikTok al tocarlo.
 */
export function LiveStreamWidget({ streams, dismissKey = DISMISS_KEY }: { streams?: LiveStream[]; dismissKey?: string }) {
  const { categories, liveStreams } = useData()
  const live = (streams ?? liveStreams).filter(s => s.isLive && isValid(s))
  const liveKey = live.map(s => s.id).sort().join(",")
  const embeddable = live.filter(s => s.provider === "youtube")

  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    try { setDismissedKey(sessionStorage.getItem(dismissKey)) } catch { /* almacenamiento no disponible */ }
  }, [dismissKey])

  useEffect(() => {
    if (embeddable.length && !embeddable.some(s => s.id === activeId)) setActiveId(embeddable[0].id)
  }, [embeddable, activeId])

  if (!live.length || dismissedKey === liveKey) return null

  const categoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name ?? "Categoría"
  const dismiss = () => {
    try { sessionStorage.setItem(dismissKey, liveKey) } catch { /* almacenamiento no disponible */ }
    setDismissedKey(liveKey)
  }

  // Nada de YouTube activo (solo TikTok): tarjeta simple que redirige, sin reproductor.
  const active = embeddable.find(s => s.id === activeId) ?? embeddable[0]
  if (!active) {
    const tiktokOnly = live[0]
    return (
      <a
        href={tiktokOnly.url}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 z-50 flex w-[min(320px,calc(100vw-2rem))] items-center gap-2 overflow-hidden rounded-2xl border border-border bg-card px-3 py-2.5 shadow-[0_12px_40px_-10px_rgba(0,0,0,.35)] transition-colors hover:bg-muted"
      >
        <span className="status-dot shrink-0 animate-pulse bg-[hsl(4_90%_58%)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">
          En vivo en TikTok · {categoryName(tiktokOnly.categoryId)}
        </span>
        <ExternalLink size={15} className="shrink-0 text-muted-foreground" />
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); dismiss() }}
          aria-label="Cerrar previsualización"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
        >
          <X size={14} />
        </button>
      </a>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-10px_rgba(0,0,0,.35)]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="status-dot animate-pulse bg-[hsl(4_90%_58%)]" aria-hidden="true" />
        <span className="flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">
          En vivo · {categoryName(active.categoryId)}{active.label ? ` · ${active.label}` : ""}
        </span>
        <Link href="/envivo" aria-label="Ver todas las transmisiones" title="Ver todas" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground">
          <Maximize2 size={14} />
        </Link>
        <button
          type="button"
          onClick={() => setMinimized(m => !m)}
          aria-label={minimized ? "Expandir previsualización" : "Minimizar previsualización"}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
        >
          {minimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar previsualización"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>

      {!minimized && (
        <>
          {live.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto px-3 pt-2 [scrollbar-width:none]">
              {live.map(s => s.provider === "tiktok" ? (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  {categoryName(s.categoryId)} <ExternalLink size={10} />
                </a>
              ) : (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${s.id === active.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {categoryName(s.categoryId)}
                </button>
              ))}
            </div>
          )}
          <div className="aspect-video w-full bg-black">
            <iframe
              key={active.id}
              src={youtubeEmbedUrl(active.videoId!, { autoplay: true })}
              title={`En vivo · ${categoryName(active.categoryId)}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </>
      )}

      {minimized && (
        <button type="button" onClick={() => setMinimized(false)} className="flex w-full items-center gap-2 px-3 py-2.5 text-[12px] text-muted-foreground hover:text-foreground">
          <Radio size={13} /> Toca para volver a ver el directo
        </button>
      )}
    </div>
  )
}
