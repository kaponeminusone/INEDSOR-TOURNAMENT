import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Ban, Check, Flag, Play, RotateCcw, Undo2, X } from "lucide-react"
import type { EntrantInfo } from "@/lib/data"
import { formatMs } from "@/lib/competition"

export type RunResult = { status: "done" | "dnf"; timeMs: number; splits: number[]; checkpoints: number }

type Props = {
  info: EntrantInfo
  subtitle: string
  mode: "checkpoints" | "finish"
  checkpoints: string[]
  timeLimitSec: number
  onSave: (result: RunResult) => Promise<boolean>
  onClose: () => void
}

const buzz = () => { try { navigator.vibrate?.(25) } catch { /* not supported */ } }

export function RunTimer({ info, subtitle, mode, checkpoints, timeLimitSec, onSave, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<"idle" | "running" | "result">("idle")
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(0)
  const [splits, setSplits] = useState<number[]>([])
  const [result, setResult] = useState<RunResult | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void rootRef.current?.requestFullscreen?.().catch(() => {})
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (phase !== "running") return
    let frame = 0
    const tick = () => { setNow(performance.now()); frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const elapsed = phase === "running" ? Math.round(now - startAt) : result?.timeMs ?? 0
  const overLimit = elapsed > timeLimitSec * 1000

  const start = () => { buzz(); const t = performance.now(); setStartAt(t); setNow(t); setSplits([]); setResult(null); setPhase("running") }
  const finish = (status: "done" | "dnf", passed = splits) => {
    buzz()
    const timeMs = Math.round(performance.now() - startAt)
    setResult({ status, timeMs: status === "done" && mode === "checkpoints" ? passed[passed.length - 1] ?? timeMs : timeMs, splits: passed, checkpoints: mode === "checkpoints" ? passed.length : status === "done" ? 1 : 0 })
    setPhase("result")
  }
  const pass = () => {
    buzz()
    const next = [...splits, Math.round(performance.now() - startAt)]
    setSplits(next)
    if (next.length >= checkpoints.length) finish("done", next)
  }
  const undo = () => { buzz(); if (splits.length) setSplits(s => s.slice(0, -1)); else setPhase("idle") }

  const save = async () => {
    if (!result) return
    setSaving(true)
    const ok = await onSave(result)
    setSaving(false)
    if (ok) onClose()
  }

  const current = checkpoints[splits.length]
  const big = "flex flex-col items-center justify-center gap-2 rounded-[28px] text-[17px] font-semibold transition-transform active:scale-[0.96]"

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[1000] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label={`Cronómetro de ${info.name}`}>
      <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <div className="truncate text-[20px] font-semibold tracking-[-0.02em]">{info.name}</div>
          <div className="truncate text-[13px] text-white/55">{info.schoolInitials} · {subtitle}</div>
        </div>
        {phase !== "running" && (
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 hover:bg-white/20"><X size={20} /></button>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
        <div className={`tabular font-semibold leading-none tracking-[-0.04em] ${overLimit ? "text-[#ff6961]" : ""}`} style={{ fontSize: "clamp(64px, 20vw, 160px)" }}>
          {formatMs(elapsed)}
        </div>
        <div className="mt-3 h-6 text-[14px] text-white/55">
          {overLimit ? "Tiempo límite superado" : phase === "running" ? `Límite ${Math.floor(timeLimitSec / 60)}:${String(timeLimitSec % 60).padStart(2, "0")}` : ""}
        </div>

        {mode === "checkpoints" && (
          <div className="mt-6 w-full max-w-md">
            {phase === "running" && current && <div className="mb-4 text-[22px] font-semibold">Siguiente: {current}</div>}
            <ol className="flex flex-wrap justify-center gap-2">
              {checkpoints.map((name, i) => {
                const t = (phase === "result" ? result?.splits : splits)?.[i]
                return (
                  <li key={name} className={`rounded-2xl px-3 py-2 text-[13px] ${t != null ? "bg-[#30d158]/20 text-[#7dffa0]" : i === splits.length && phase === "running" ? "bg-white/15" : "bg-white/6 text-white/40"}`}>
                    <div className="font-medium">{name}</div>
                    <div className="tabular text-[12px]">{t != null ? formatMs(t) : "—"}</div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {phase === "result" && result && (
          <div className={`mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[17px] font-semibold ${result.status === "done" ? "bg-[#30d158]/20 text-[#7dffa0]" : "bg-[#ff453a]/20 text-[#ff8a80]"}`}>
            {result.status === "done" ? <Flag size={18} /> : <Ban size={18} />}
            {result.status === "done" ? "Completado" : mode === "checkpoints" ? `No completado · ${result.checkpoints} de ${checkpoints.length}` : "No completado"}
          </div>
        )}
      </main>

      <footer className="grid grid-cols-3 gap-3 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3" style={{ minHeight: "30vh" }}>
        {phase === "idle" && (
          <button type="button" onClick={start} className={`${big} col-span-3 bg-[#0a84ff] text-[22px]`}>
            <Play size={40} fill="currentColor" /> Iniciar
          </button>
        )}
        {phase === "running" && mode === "checkpoints" && (
          <>
            <button type="button" onClick={() => finish("dnf")} className={`${big} bg-[#ff453a]/90`}><Ban size={42} /> No pasó</button>
            <button type="button" onClick={undo} className={`${big} bg-white/14`}><Undo2 size={40} /> Deshacer</button>
            <button type="button" onClick={pass} className={`${big} bg-[#30d158] text-black`}><Check size={46} strokeWidth={3} /> Pasó</button>
          </>
        )}
        {phase === "running" && mode === "finish" && (
          <>
            <button type="button" onClick={() => finish("done")} className={`${big} bg-[#30d158] text-black`}><Flag size={40} /> Completado</button>
            <button type="button" onClick={() => finish("dnf")} className={`${big} bg-[#ff453a]/90`}><Ban size={42} /> No completado</button>
            <button type="button" onClick={() => { buzz(); setPhase("idle") }} className={`${big} bg-white/14`}><RotateCcw size={38} /> Reiniciar</button>
          </>
        )}
        {phase === "result" && (
          <>
            <button type="button" onClick={() => { setResult(null); setPhase("idle") }} className={`${big} bg-white/14`}><RotateCcw size={36} /> Repetir</button>
            <button type="button" disabled={saving} onClick={() => void save()} className={`${big} col-span-2 bg-[#0a84ff] text-[20px] disabled:opacity-50`}><Check size={40} strokeWidth={3} /> {saving ? "Guardando…" : "Guardar"}</button>
          </>
        )}
      </footer>
    </div>,
    document.body
  )
}
