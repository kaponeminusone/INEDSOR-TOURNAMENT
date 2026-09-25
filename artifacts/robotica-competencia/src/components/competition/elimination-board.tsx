import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Check, Megaphone, RotateCcw } from "lucide-react"
import type { EntrantInfo } from "@/lib/data"
import { resolveMatches, roundLabel, type CompetitionMatch, type MatchState, type ResolvedMatch, type Side, type Stage } from "@/lib/competition"

type Props = {
  matches: CompetitionMatch[]
  describe: (key: string) => EntrantInfo
  editable?: boolean
  editMode?: boolean
  animateIn?: boolean
  onWinner?: (matchId: string, key: string | null) => void
  onActive?: (matchId: string, active: boolean) => void
}

const stateStyle: Record<MatchState, string> = {
  waiting: "bg-card",
  ready: "bg-card",
  active: "bg-card ring-2 ring-[hsl(32_95%_50%)]",
  done: "bg-[hsl(142_60%_97%)] ring-1 ring-success/30",
  bye: "bg-muted/60 opacity-70",
  skipped: "bg-muted/60 opacity-50",
  review: "bg-card ring-2 ring-destructive",
}

const stateLabel: Record<MatchState, string> = {
  waiting: "Esperando", ready: "Listo", active: "En pista", done: "Finalizado", bye: "Pase directo", skipped: "No necesaria", review: "Revisar",
}

const stateColor: Record<MatchState, string> = {
  waiting: "text-muted-foreground", ready: "text-primary", active: "text-[hsl(32_95%_42%)]", done: "text-success",
  bye: "text-muted-foreground", skipped: "text-muted-foreground", review: "text-destructive",
}

function columnStatus(list: ResolvedMatch[]) {
  const finished = list.every(m => ["done", "bye", "skipped"].includes(m.state))
  if (finished) return { label: "Finalizada", className: "bg-success/12 text-success" }
  if (list.some(m => m.state === "active" || m.state === "done")) return { label: "En juego", className: "bg-[hsl(32_95%_50%/0.14)] text-[hsl(32_95%_38%)]" }
  return { label: "Pendiente", className: "bg-muted text-muted-foreground" }
}

export function EliminationBoard({ matches, describe, editable, editMode, animateIn, onWinner, onActive }: Props) {
  const resolved = useMemo(() => resolveMatches(matches), [matches])
  const reduce = useReducedMotion()
  const [selected, setSelected] = useState<{ matchId: string; key: string } | null>(null)

  const winnerRounds = Math.max(0, ...matches.filter(m => m.stage === "W").map(m => m.round))
  const loserRounds = Math.max(0, ...matches.filter(m => m.stage === "L").map(m => m.round))
  const column = (stage: Stage, round: number) => matches.filter(m => m.stage === stage && m.round === round).sort((a, b) => a.position - b.position).map(m => resolved.get(m.id)!)

  const sections: { title: string | null; columns: { label: string; list: ResolvedMatch[] }[] }[] = [
    { title: loserRounds ? "Llave principal" : null, columns: Array.from({ length: winnerRounds }, (_, i) => ({ label: roundLabel("W", i + 1, winnerRounds), list: column("W", i + 1) })) },
  ]
  const third = matches.filter(m => m.stage === "3P").map(m => resolved.get(m.id)!)
  if (third.length) sections[0].columns.push({ label: roundLabel("3P", 0, winnerRounds), list: third })
  if (loserRounds) {
    sections.push({ title: "Repechaje (llave de perdedores)", columns: Array.from({ length: loserRounds }, (_, i) => ({ label: roundLabel("L", i + 1, winnerRounds, loserRounds), list: column("L", i + 1) })) })
    const finals = ["GF", "GF2"].flatMap(stage => matches.filter(m => m.stage === stage).map(m => resolved.get(m.id)!))
    sections.push({ title: "Gran final", columns: finals.map(m => ({ label: roundLabel(m.stage, 0, winnerRounds), list: [m] })) })
  }

  const downstreamLocked = (matchId: string) => matches.some(m =>
    m.winnerKey && [m.sourceA, m.sourceB].some(s => s && "match" in s && s.match === matchId))

  let order = 0

  return (
    <div className="space-y-10">
      {sections.map((section, si) => (
        <section key={si}>
          {section.title && <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{section.title}</h3>}
          <div className="overflow-x-auto pb-3 [scrollbar-width:thin]">
            <div className="flex min-w-max gap-6">
              {section.columns.map(col => {
                const status = columnStatus(col.list)
                return (
                  <div key={col.label} className="flex w-[260px] flex-col">
                    <div className="mb-3 flex items-center justify-between gap-2 px-1">
                      <span className="text-[14px] font-semibold tracking-[-0.01em]">{col.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>{status.label}</span>
                    </div>
                    <div className="flex flex-1 flex-col justify-around gap-4">
                      {col.list.map(m => {
                        const delay = animateIn && !reduce ? order++ * 0.09 : 0
                        const interactive = editable && (m.state === "ready" || m.state === "active")
                        const canReopen = editable && editMode && m.state === "done" && !downstreamLocked(m.id)
                        return (
                          <motion.article
                            key={m.id}
                            initial={animateIn && !reduce ? { opacity: 0, scale: 0.82, y: 16 } : false}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
                            className={`rounded-2xl p-1 shadow-[0_1px_2px_rgba(0,0,0,.05),0_6px_18px_-8px_rgba(0,0,0,.14)] transition-colors ${stateStyle[m.state]}`}
                          >
                            <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[11px]">
                              <span className="font-medium text-muted-foreground">#{m.position + 1}</span>
                              <span className={`inline-flex items-center gap-1.5 font-medium ${stateColor[m.state]}`}>
                                <span className={`status-dot ${m.state === "active" ? "animate-pulse" : ""}`} /> {stateLabel[m.state]}
                              </span>
                            </div>
                            {(["a", "b"] as const).map(sideKey => (
                              <SideRow
                                key={sideKey}
                                side={m[sideKey]}
                                describe={describe}
                                winner={m.winner.kind === "entrant" && m[sideKey].kind === "entrant" && m.winner.key === (m[sideKey] as { key: string }).key && m.state !== "bye"}
                                loser={m.state === "done" && m.loser.kind === "entrant" && m[sideKey].kind === "entrant" && m.loser.key === (m[sideKey] as { key: string }).key}
                                selected={selected?.matchId === m.id && m[sideKey].kind === "entrant" && selected.key === (m[sideKey] as { key: string }).key}
                                onSelect={interactive && m[sideKey].kind === "entrant" ? () => setSelected({ matchId: m.id, key: (m[sideKey] as { key: string }).key }) : undefined}
                              />
                            ))}
                            {interactive && (
                              <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
                                {selected?.matchId === m.id ? (
                                  <>
                                    <button type="button" onClick={() => { onWinner?.(m.id, selected.key); setSelected(null) }} className="btn-pill btn-primary btn-sm h-9 flex-1">
                                      <Check size={15} /> Confirmar ganador
                                    </button>
                                    <button type="button" onClick={() => setSelected(null)} className="btn-pill btn-secondary btn-sm h-9">Cancelar</button>
                                  </>
                                ) : (
                                  <>
                                    <span className="flex-1 px-1 text-[12px] text-muted-foreground">Toca al ganador</span>
                                    <button type="button" onClick={() => onActive?.(m.id, m.state !== "active")} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors ${m.state === "active" ? "bg-[hsl(32_95%_50%/0.15)] text-[hsl(32_95%_38%)]" : "bg-muted text-foreground/75 hover:text-foreground"}`}>
                                      <Megaphone size={13} /> {m.state === "active" ? "En pista" : "Llamar"}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            {canReopen && (
                              <div className="px-2 pb-2">
                                <button type="button" onClick={() => onWinner?.(m.id, null)} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-destructive/10 text-[12px] font-medium text-destructive">
                                  <RotateCcw size={13} /> Cambiar resultado
                                </button>
                              </div>
                            )}
                            {editable && editMode && m.state === "done" && !canReopen && (
                              <p className="px-3 pb-2 text-[11px] text-muted-foreground">Para cambiarlo, reabre primero el encuentro siguiente.</p>
                            )}
                          </motion.article>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

function SideRow({ side, describe, winner, loser, selected, onSelect }: { side: Side; describe: (key: string) => EntrantInfo; winner: boolean; loser: boolean; selected: boolean; onSelect?: () => void }) {
  const info = side.kind === "entrant" ? describe(side.key) : null
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[14px] ${winner ? "font-semibold" : ""} ${loser ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""} ${side.kind !== "entrant" ? "text-muted-foreground/70" : ""}`}>
          {info ? info.name : side.kind === "bye" ? "Pase directo" : "Por definir"}
        </span>
        {info && <span className="block truncate text-[11px] text-muted-foreground">{info.schoolInitials}</span>}
      </span>
      {winner && <Check size={16} className="shrink-0 text-success" aria-label="Ganador" />}
    </>
  )
  const className = `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${selected ? "bg-primary/12 ring-2 ring-primary" : ""}`
  return onSelect
    ? <button type="button" onClick={onSelect} className={`${className} hover:bg-muted`}>{content}</button>
    : <div className={className}>{content}</div>
}
