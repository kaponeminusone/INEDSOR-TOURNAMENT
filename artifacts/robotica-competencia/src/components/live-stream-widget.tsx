import { useEffect, useState } from "react"
import { Link } from "wouter"
import { Radio, X, ChevronDown, ChevronUp, Maximize2 } from "lucide-react"
import { useData, type LiveStream } from "@/lib/data"
import { youtubeEmbedUrl } from "@/lib/youtube"

const DISMISS_KEY = "torneo:stream-widget-dismissed"

/**
 * Previsualización flotante de transmisiones en vivo.
 * Sin `streams`, muestra todas las categorías activas (uso en AppLayout).
 * Con `streams`, muestra solo esas (ej. la categoría seleccionada en /bracket).
 */
export function LiveStreamWidget({ streams, dismissKey = DISMISS_KEY }: { streams?: LiveStream[]; dismissKey?: string }) {
  const { categories, liveStreams } = useData()
  const live = (streams ?? liveStreams).filter(s => s.isLive && s.videoId)
  const liveKey = live.map(s => s.id).sort().join(",")

  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    try { setDismissedKey(sessionStorage.getItem(dismissKey)) } catch { /* almacenamiento no disponible */ }
  }, [dismissKey])

  useEffect(() => {
    if (live.length && !live.some(s => s.id === activeId)) setActiveId(live[0].id)
  }, [live, activeId])

  if (!live.length || dismissedKey === liveKey) return null

  const active = live.find(s => s.id === activeId) ?? live[0]
  const categoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name ?? "Categoría"

  const dismiss = () => {
    try { sessionStorage.setItem(dismissKey, liveKey) } catch { /* almacenamiento no disponible */ }
    setDismissedKey(liveKey)
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
              {live.map(s => (
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
