import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Flag, Megaphone, RotateCcw } from "lucide-react"
import type { EntrantInfo } from "@/lib/data"
import { resolveMatches, type CompetitionMatch, type CompetitionSettings, type ResolvedMatch } from "@/lib/competition"

type Props = {
  matches: CompetitionMatch[]
  settings: CompetitionSettings
  describe: (key: string) => EntrantInfo
  editable?: boolean
  editMode?: boolean
  animateIn?: boolean
  onPlacements?: (matchId: string, placements: string[] | null) => void
  onActive?: (matchId: string, active: boolean) => void
}

export function HeatsBoard({ matches, settings, describe, editable, editMode, animateIn, onPlacements, onActive }: Props) {
  const resolved = useMemo(() => resolveMatches(matches), [matches])
  const reduce = useReducedMotion()
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)
  const lastRound = rounds[rounds.length - 1]
  let order = 0

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex min-w-max gap-6">
        {rounds.map(round => {
          const heats = matches.filter(m => m.round === round).sort((a, b) => a.position - b.position).map(m => resolved.get(m.id)!)
          const finished = heats.every(h => h.state === "done")
          const isFinal = round === lastRound
          return (
            <div key={round} className="flex w-[280px] flex-col">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[14px] font-semibold tracking-[-0.01em]">{isFinal ? "Final" : `Ronda ${round}`}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${finished ? "bg-success/12 text-success" : heats.some(h => h.state === "done" || h.state === "active") ? "bg-[hsl(32_95%_50%/0.14)] text-[hsl(32_95%_38%)]" : "bg-muted text-muted-foreground"}`}>
                  {finished ? "Finalizada" : heats.some(h => h.state === "done" || h.state === "active") ? "En juego" : "Pendiente"}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {heats.map(heat => (
                  <HeatCard
                    key={heat.id}
                    heat={heat}
                    title={isFinal ? "Final" : `Serie ${heat.position + 1}`}
                    advance={isFinal ? settings.places : settings.advancePerHeat}
                    isFinal={isFinal}
                    describe={describe}
                    editable={editable}
                    editMode={editMode}
                    delay={animateIn && !reduce ? order++ * 0.09 : null}
                    onPlacements={onPlacements}
                    onActive={onActive}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeatCard({ heat, title, advance, isFinal, describe, editable, editMode, delay, onPlacements, onActive }: {
  heat: ResolvedMatch; title: string; advance: number; isFinal: boolean; describe: (key: string) => EntrantInfo
  editable?: boolean; editMode?: boolean; delay: number | null
  onPlacements?: (matchId: string, placements: string[] | null) => void; onActive?: (matchId: string, active: boolean) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const entrants = heat.entrants.filter((s): s is { kind: "entrant"; key: string } => s.kind === "entrant").map(s => s.key)
  const needed = Math.min(advance, entrants.length)
  const interactive = editable && (heat.state === "ready" || heat.state === "active")
  const done = heat.state === "done"
  const shown = done ? [...heat.placements, ...entrants.filter(k => !heat.placements.includes(k))] : entrants

  const toggle = (key: string) => setPicked(list => list.includes(key) ? list.filter(k => k !== key) : [...list, key])

  return (
    <motion.article
      initial={delay !== null ? { opacity: 0, scale: 0.82, y: 16 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: delay ?? 0, type: "spring", stiffness: 260, damping: 22 }}
      className={`rounded-2xl p-1 shadow-[0_1px_2px_rgba(0,0,0,.05),0_6px_18px_-8px_rgba(0,0,0,.14)] ${done ? "bg-[hsl(142_60%_97%)] ring-1 ring-success/30" : heat.state === "active" ? "bg-card ring-2 ring-[hsl(32_95%_50%)]" : "bg-card"}`}
    >
      <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[12px]">
        <span className="font-semibold">{title}</span>
        <span className="text-muted-foreground">{heat.state === "waiting" ? "Esperando clasificados" : `${entrants.length} carritos · ${isFinal ? "podio" : `pasan ${needed}`}`}</span>
      </div>
      <ol className="space-y-0.5 px-1 pb-1">
        {heat.state === "waiting" && heat.entrants.map((_, i) => (
          <li key={i} className="rounded-xl px-2 py-2 text-[13px] text-muted-foreground/70">Por definir</li>
        ))}
        {heat.state !== "waiting" && shown.map(key => {
          const info = describe(key)
          const place = done ? heat.placements.indexOf(key) + 1 : picked.indexOf(key) + 1
          const qualifies = done && place > 0 && place <= needed
          const Row = interactive ? "button" : "div"
          return (
            <li key={key}>
              <Row
                {...(interactive ? { type: "button" as const, onClick: () => toggle(key) } : {})}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors ${interactive ? "hover:bg-muted" : ""} ${place && !done ? "bg-primary/10" : ""}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${place ? (qualifies || !done ? "bg-foreground text-background" : "bg-muted text-muted-foreground") : "border border-dashed border-input text-transparent"}`}>{place || "·"}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[14px] ${qualifies ? "font-semibold" : done ? "text-muted-foreground" : ""}`}>{info.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{info.schoolInitials}</span>
                </span>
                {qualifies && <span className="text-[11px] font-medium text-success">{isFinal ? `${place}.º` : "Clasifica"}</span>}
              </Row>
            </li>
          )
        })}
      </ol>
      {interactive && (
        <div className="flex items-center gap-1.5 px-2 pb-2">
          {picked.length ? (
            <>
              <button type="button" disabled={picked.length < needed} onClick={() => { onPlacements?.(heat.id, picked); setPicked([]) }} className="btn-pill btn-primary btn-sm h-9 flex-1">
                <Flag size={14} /> Guardar llegada
              </button>
              <button type="button" onClick={() => setPicked([])} className="btn-pill btn-secondary btn-sm h-9">Limpiar</button>
            </>
          ) : (
            <>
              <span className="flex-1 px-1 text-[12px] text-muted-foreground">Toca en orden de llegada (mín. {needed})</span>
              <button type="button" onClick={() => onActive?.(heat.id, heat.state !== "active")} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium ${heat.state === "active" ? "bg-[hsl(32_95%_50%/0.15)] text-[hsl(32_95%_38%)]" : "bg-muted text-foreground/75"}`}>
                <Megaphone size={13} /> {heat.state === "active" ? "En pista" : "Llamar"}
              </button>
            </>
          )}
        </div>
      )}
      {editable && editMode && done && (
        <div className="px-2 pb-2">
          <button type="button" onClick={() => onPlacements?.(heat.id, null)} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-destructive/10 text-[12px] font-medium text-destructive">
            <RotateCcw size={13} /> Cambiar llegada
          </button>
        </div>
      )}
    </motion.article>
  )
}
