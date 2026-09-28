import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Hand, Maximize2, Minimize2, Minus, Plus, RotateCcw } from "lucide-react"

// Contenedor tipo "canvas" para llaves grandes: arrastrar para moverte, zoom y pantalla completa.
// Se usa alrededor de EliminationBoard/HeatsBoard en vez de su scroll horizontal simple de antes.
export function BracketCanvas({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  const [maximized, setMaximized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panState = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 })

  useEffect(() => {
    if (!maximized) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMaximized(false) }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = "" }
  }, [maximized])

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container || event.button !== 0) return
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return
    panState.current = { active: true, x: event.clientX, y: event.clientY, left: container.scrollLeft, top: container.scrollTop }
    container.setPointerCapture(event.pointerId)
  }
  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container || !panState.current.active) return
    container.scrollLeft = panState.current.left - (event.clientX - panState.current.x)
    container.scrollTop = panState.current.top - (event.clientY - panState.current.y)
  }
  const endPan = () => { panState.current.active = false }

  const canvas = (
    <div className={`relative overflow-hidden rounded-[20px] border border-border bg-muted/20 ${maximized ? "h-full" : ""}`}>
      <div
        ref={containerRef}
        className={`touch-none select-none overflow-auto [scrollbar-width:thin] ${maximized ? "h-full" : "h-[min(560px,70dvh)]"}`}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div className="w-max origin-top-left p-8 transition-transform duration-150 ease-out" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-between px-3">
        <span className="chip pointer-events-auto bg-card/85 text-muted-foreground shadow-sm backdrop-blur-xl"><Hand size={13} /> Arrastra para moverte</span>
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-card/90 p-1 shadow-[0_4px_16px_rgba(0,0,0,.12)] backdrop-blur-xl">
          <button type="button" onClick={() => setScale(s => Math.max(s - 0.15, 0.4))} aria-label="Alejar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Minus size={15} /></button>
          <button type="button" onClick={() => setScale(1)} aria-label="Restablecer zoom" className="tabular grid h-8 min-w-12 place-items-center rounded-full px-2 text-[12px] font-medium hover:bg-muted">
            {scale === 1 ? <RotateCcw size={14} /> : `${Math.round(scale * 100)}%`}
          </button>
          <button type="button" onClick={() => setScale(s => Math.min(s + 0.15, 2.5))} aria-label="Acercar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><Plus size={15} /></button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button type="button" onClick={() => setMaximized(m => !m)} aria-label={maximized ? "Salir de pantalla completa" : "Maximizar"} title={maximized ? "Salir de pantalla completa" : "Maximizar"} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  )

  if (!maximized) return canvas
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-background p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Llave en pantalla completa">
      <div className="min-h-0 flex-1">{canvas}</div>
    </div>,
    document.body,
  )
}
