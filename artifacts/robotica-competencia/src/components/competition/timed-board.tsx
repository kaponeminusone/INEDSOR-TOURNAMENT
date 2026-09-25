import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Timer, Trash2, UserX } from "lucide-react"
import type { EntrantInfo } from "@/lib/data"
import { formatMs, nextTimedTurn, rankTimed, timedPlaces, type Competition, type Run, type TimedRow } from "@/lib/competition"
import { RunTimer, type RunResult } from "@/components/competition/run-timer"

type Props = {
  competition: Competition
  runs: Run[]
  categoryName: string
  describe: (key: string) => EntrantInfo
  editable?: boolean
  editMode?: boolean
  animateIn?: boolean
  onRecord?: (run: Omit<Run, "id" | "locked">) => Promise<boolean>
  onDeleteRun?: (runId: string) => void
}

type Turn = { key: string; attempt: number; phase: "main" | "final" }

function RunCell({ run, checkpoints }: { run?: Run; checkpoints: number }) {
  if (!run) return <span className="text-muted-foreground/60">—</span>
  if (run.status === "absent") return <span className="text-muted-foreground">Ausente</span>
  if (run.status === "dnf") return <span className="text-destructive">No completó{checkpoints ? ` · ${run.checkpoints}/${checkpoints}` : ""}</span>
  return <span className="tabular">{formatMs(run.timeMs)}</span>
}

export function TimedBoard({ competition, runs, categoryName, describe, editable, editMode, animateIn, onRecord, onDeleteRun }: Props) {
  const { settings, entrants } = competition
  const reduce = useReducedMotion()
  const [view, setView] = useState<"order" | "ranking">(competition.status === "finished" ? "ranking" : "order")
  const [turn, setTurn] = useState<Turn | null>(null)

  const ranking = useMemo(() => rankTimed(entrants, runs, settings.attempts), [entrants, runs, settings.attempts])
  const next = nextTimedTurn(entrants, runs, settings.attempts)
  const { finalists } = timedPlaces(entrants, runs, settings)
  const finalRuns = runs.filter(r => r.phase === "final")
  const pendingFinalist = finalists?.find(key => !finalRuns.some(r => r.entrantKey === key))
  const cpCount = settings.checkpoints.length
  const byKey = new Map(ranking.map(r => [r.key, r]))

  const openTurn = (t: Turn) => setTurn(t)
  const save = async (result: RunResult) => {
    if (!turn || !onRecord) return false
    return onRecord({ competitionId: competition.id, entrantKey: turn.key, phase: turn.phase, attempt: turn.attempt, status: result.status, timeMs: result.timeMs, splits: result.splits, checkpoints: result.checkpoints })
  }
  const markAbsent = (key: string) => onRecord?.({ competitionId: competition.id, entrantKey: key, phase: "main", attempt: 1, status: "absent", timeMs: null, splits: [], checkpoints: 0 })

  const attemptFor = (row: TimedRow) => {
    for (let a = 1; a <= settings.attempts; a++) if (!row.runs.some(r => r.attempt === a)) return a
    return null
  }

  const rowMotion = (i: number) => animateIn && !reduce
    ? { initial: { opacity: 0, y: 14, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { delay: i * 0.06, type: "spring" as const, stiffness: 260, damping: 24 } }
    : {}

  return (
    <div>
      {editable && competition.status !== "finished" && (
        <div className="mb-6 flex flex-col gap-3 rounded-[22px] bg-foreground p-5 text-background sm:flex-row sm:items-center sm:justify-between">
          {next ? (
            <>
              <div className="min-w-0">
                <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-background/55">Próximo turno · intento {next.attempt} de {settings.attempts}</div>
                <div className="truncate text-[22px] font-semibold tracking-[-0.02em]">{describe(next.key).name}</div>
                <div className="text-[13px] text-background/60">{describe(next.key).school}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => void markAbsent(next.key)} className="btn-pill btn-sm h-11 bg-background/15 text-background hover:bg-background/25"><UserX size={16} /> Ausente</button>
                <button type="button" onClick={() => openTurn({ key: next.key, attempt: next.attempt, phase: "main" })} className="btn-pill h-11 bg-[#0a84ff] text-white"><Timer size={17} /> Cronometrar</button>
              </div>
            </>
          ) : pendingFinalist ? (
            <>
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-background/55">Final de los 2 mejores</div>
                <div className="text-[22px] font-semibold tracking-[-0.02em]">{describe(pendingFinalist).name}</div>
              </div>
              <button type="button" onClick={() => openTurn({ key: pendingFinalist, attempt: 1, phase: "final" })} className="btn-pill h-11 bg-[#0a84ff] text-white"><Timer size={17} /> Cronometrar final</button>
            </>
          ) : (
            <div className="text-[17px] font-semibold">Todos los intentos están registrados.</div>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented" role="group" aria-label="Vista">
          <button type="button" aria-pressed={view === "order"} onClick={() => setView("order")}>Orden de salida</button>
          <button type="button" aria-pressed={view === "ranking"} onClick={() => setView("ranking")}>Clasificación</button>
        </div>
        <span className="text-[13px] text-muted-foreground">
          {settings.attempts} {settings.attempts === 1 ? "intento" : "intentos"} · cuenta el mejor · límite {Math.round(settings.timeLimitSec / 60 * 10) / 10} min
        </span>
      </div>

      {finalists && (
        <div className="mb-4 rounded-2xl bg-[hsl(40_90%_48%/0.1)] p-4">
          <div className="text-[13px] font-semibold">Final: {finalists.map(k => describe(k).name).join(" vs ")}</div>
          <div className="mt-2 flex flex-wrap gap-4 text-[14px]">
            {finalists.map(key => (
              <span key={key}>{describe(key).name}: <RunCell run={finalRuns.find(r => r.entrantKey === key)} checkpoints={cpCount} /></span>
            ))}
          </div>
        </div>
      )}

      <div className="panel overflow-x-auto">
        <table className="table-apple min-w-[560px]">
          <thead>
            <tr>
              <th className="w-12 text-center">{view === "order" ? "Turno" : "Pos."}</th>
              <th>Participante</th>
              {Array.from({ length: settings.attempts }, (_, i) => <th key={i}>Intento {i + 1}</th>)}
              <th className="text-right">{view === "order" ? "" : "Mejor"}</th>
            </tr>
          </thead>
          <tbody>
            {(view === "order" ? entrants.map(e => byKey.get(e.key)!) : ranking).map((row, i) => {
              const info = describe(row.key)
              const attempt = attemptFor(row)
              return (
                <motion.tr key={row.key} {...rowMotion(i)} className={row.absent ? "opacity-55" : ""}>
                  <td className="text-center text-[15px] font-semibold text-muted-foreground">{view === "order" ? row.order + 1 : row.absent || !row.best ? "—" : i + 1}</td>
                  <td>
                    <div className="font-semibold tracking-[-0.015em]">{info.name}</div>
                    <div className="text-[12px] text-muted-foreground">{info.school}</div>
                  </td>
                  {Array.from({ length: settings.attempts }, (_, a) => {
                    const run = row.runs.find(r => r.attempt === a + 1) ?? (a === 0 && row.absent ? row.runs[0] : undefined)
                    return (
                      <td key={a} className="text-[14px]">
                        <RunCell run={run} checkpoints={cpCount} />
                        {run && cpCount > 0 && run.splits.length > 0 && (
                          <div className="tabular mt-0.5 text-[11px] text-muted-foreground">
                            {run.splits.map((t, s) => `${settings.checkpoints[s]} ${formatMs(t - (run.splits[s - 1] ?? 0))}`).join(" · ")}
                          </div>
                        )}
                        {editable && editMode && run && (
                          <button type="button" onClick={() => onDeleteRun?.(run.id)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-destructive"><Trash2 size={11} /> Borrar</button>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-right">
                    {view === "ranking" ? (
                      <span className="text-[15px] font-semibold"><RunCell run={row.best ?? undefined} checkpoints={cpCount} /></span>
                    ) : editable && competition.status !== "finished" && !row.absent && attempt ? (
                      <div className="flex justify-end gap-1.5">
                        {attempt === 1 && <button type="button" onClick={() => void markAbsent(row.key)} className="btn-pill btn-secondary btn-sm h-8 px-3 text-[12px]">Ausente</button>}
                        <button type="button" onClick={() => openTurn({ key: row.key, attempt, phase: "main" })} className="btn-pill btn-primary btn-sm h-8 px-3 text-[12px]"><Timer size={13} /> Intento {attempt}</button>
                      </div>
                    ) : null}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {turn && (
        <RunTimer
          info={describe(turn.key)}
          subtitle={`${categoryName} · ${turn.phase === "final" ? "Final" : `Intento ${turn.attempt}`}`}
          mode={cpCount > 0 ? "checkpoints" : "finish"}
          checkpoints={settings.checkpoints}
          timeLimitSec={settings.timeLimitSec}
          onSave={save}
          onClose={() => setTurn(null)}
        />
      )}
    </div>
  )
}
