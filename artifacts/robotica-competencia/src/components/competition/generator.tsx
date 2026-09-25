import { useMemo, useState } from "react"
import { Clock, Minus, Plus, Shuffle, Users } from "lucide-react"
import { useData, type Category } from "@/lib/data"
import {
  buildEntrants, defaultSettings, drawFirstRound, estimate, formatDuration, generateElimination, generateHeats,
  type CompetitionSettings,
} from "@/lib/competition"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="text-[15px] font-medium tracking-[-0.01em]">{title}</div>
        {hint && <div className="text-[13px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Stepper({ value, min, max, onChange, suffix }: { value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
      <button type="button" aria-label="Menos" disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-card shadow-sm disabled:opacity-40"><Minus size={14} /></button>
      <span className="tabular min-w-[64px] text-center text-[15px] font-semibold">{value}{suffix ? ` ${suffix}` : ""}</span>
      <button type="button" aria-label="Más" disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-card shadow-sm disabled:opacity-40"><Plus size={14} /></button>
    </div>
  )
}

export function CompetitionGenerator({ category }: { category: Category }) {
  const { robots, participants, createCompetition } = useData()
  const kind = category.format
  const [settings, setSettings] = useState<CompetitionSettings>(() => defaultSettings(kind, category.slug, category.teamSize))
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof CompetitionSettings>(key: K, value: CompetitionSettings[K]) => setSettings(s => ({ ...s, [key]: value }))

  const inCategory = robots.filter(r => r.categories.includes(category.id))
  const ownerOf = (robotId: string) => participants.find(p => p.id === robots.find(r => r.id === robotId)?.participantId)
  const eligible = inCategory.filter(r => !settings.onlyPresent || ownerOf(r.id)?.attendedAt)
  const schoolOf = (robotId: string) => ownerOf(robotId)?.institutionId ?? "sin-colegio"
  const entrantCount = kind === "elimination" && settings.teamSize === 2 ? Math.ceil(eligible.length / 2) : eligible.length
  const est = useMemo(() => estimate(kind, category.slug, entrantCount, settings), [kind, category.slug, entrantCount, settings])
  const tooFew = entrantCount < (kind === "direct" || kind === "timed" ? 1 : 2)

  const generate = async () => {
    setBusy(true)
    const entrants = buildEntrants(eligible.map(r => r.id), kind === "elimination" ? settings.teamSize : 1, schoolOf)
    const schoolOfEntrant = (e: { robots: string[] }) => schoolOf(e.robots[0])
    const matches = kind === "elimination"
      ? generateElimination(drawFirstRound(entrants, schoolOfEntrant, settings.avoidSameSchool), settings)
      : kind === "heats" ? generateHeats(entrants, schoolOfEntrant, settings) : []
    const ok = await createCompetition({ categoryId: category.id, kind, settings, entrants, estimateMinutes: est.minutes, matches })
    setBusy(false)
    if (ok) setConfirming(false)
  }

  const summary: { label: string; value: string }[] = [
    { label: kind === "elimination" && settings.teamSize === 2 ? "Equipos" : "Participantes", value: String(entrantCount) },
    ...(settings.onlyPresent && inCategory.length !== eligible.length ? [{ label: "Sin asistencia (quedan fuera)", value: String(inCategory.length - eligible.length) }] : []),
    ...(kind === "elimination" ? [
      { label: "Encuentros", value: String(est.matches) },
      { label: "Rondas de la llave principal", value: String(est.rounds) },
      { label: "Pases directos (byes)", value: String(est.byes) },
    ] : []),
    ...(kind === "heats" ? [{ label: "Series en total", value: String(est.matches) }, { label: "Rondas", value: String(est.rounds) }] : []),
    ...(kind === "timed" ? [{ label: "Intentos cronometrados", value: String(est.runs) }] : []),
  ]

  return (
    <div className="panel p-6 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">Generar {kind === "elimination" ? "llave" : kind === "heats" ? "series" : kind === "timed" ? "orden de salida" : "competencia"}</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {inCategory.length} inscritos · {eligible.length} {settings.onlyPresent ? "con asistencia confirmada" : "participarán"}. El sorteo es aleatorio y se revisa antes de revelarlo.
          </p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-border border-y border-border">
        <Row title="Solo participantes presentes" hint="Usa la asistencia marcada en Control → Asistencia.">
          <Switch checked={settings.onlyPresent} onCheckedChange={v => set("onlyPresent", v)} />
        </Row>

        {(kind === "elimination" || kind === "heats") && (
          <Row title="Evitar el mismo colegio al inicio" hint={kind === "elimination" ? "En la primera ronda cruza colegios distintos siempre que se pueda." : "Mezcla colegios dentro de cada serie."}>
            <Switch checked={settings.avoidSameSchool} onCheckedChange={v => set("avoidSameSchool", v)} />
          </Row>
        )}

        {kind === "elimination" && (
          <>
            {category.teamSize === 2 && (
              <Row title="Equipos de 2 robots" hint="Se forman con robots del mismo colegio cuando es posible.">
                <Switch checked={settings.teamSize === 2} onCheckedChange={v => set("teamSize", v ? 2 : 1)} />
              </Row>
            )}
            <Row title="Repechaje (doble eliminación)" hint="Quien pierde pasa a la llave de perdedores; su ganador disputa la gran final.">
              <Switch checked={settings.doubleElimination} onCheckedChange={v => set("doubleElimination", v)} />
            </Row>
            {!settings.doubleElimination && (
              <Row title="Partido por el tercer puesto" hint="Si se desactiva, los dos perdedores de semifinal comparten el 3.er puesto.">
                <Switch checked={settings.thirdPlace} onCheckedChange={v => set("thirdPlace", v)} />
              </Row>
            )}
          </>
        )}

        {kind === "heats" && (
          <>
            <Row title="Carritos por serie" hint="La pista no admite a todos a la vez; las series quedan casi iguales.">
              <Stepper value={settings.heatSize} min={2} max={10} onChange={v => setSettings(s => ({ ...s, heatSize: v, advancePerHeat: Math.min(s.advancePerHeat, v - 1) }))} />
            </Row>
            <Row title="Clasifican por serie" hint="Los primeros de cada serie pasan a la siguiente ronda hasta la final.">
              <Stepper value={settings.advancePerHeat} min={1} max={settings.heatSize - 1} onChange={v => set("advancePerHeat", v)} />
            </Row>
          </>
        )}

        {kind === "timed" && (
          <>
            <Row title="Intentos por participante" hint="Cuenta el mejor.">
              <Stepper value={settings.attempts} min={1} max={5} onChange={v => set("attempts", v)} />
            </Row>
            <Row title="Tiempo límite por intento">
              <Stepper value={settings.timeLimitSec / 60} min={1} max={10} suffix="min" onChange={v => set("timeLimitSec", v * 60)} />
            </Row>
            {settings.checkpoints.length > 0 && (
              <Row title="Puntos de control" hint={settings.checkpoints.join(" · ")}>
                <Stepper value={settings.checkpoints.length} min={1} max={12} onChange={v => set("checkpoints", Array.from({ length: v }, (_, i) => `Aro ${i + 1}`))} />
              </Row>
            )}
            <Row title="Final de los 2 mejores" hint="Al terminar, los dos mejores hacen un intento final que define el 1.º y el 2.º.">
              <Switch checked={settings.finalTopTwo} onCheckedChange={v => set("finalTopTwo", v)} />
            </Row>
          </>
        )}

        {(kind === "timed" || kind === "heats" || kind === "direct") && (
          <Row title="Puestos premiados">
            <div className="segmented">
              {([1, 2, 3] as const).map(n => (
                <button key={n} type="button" aria-pressed={settings.places === n} onClick={() => set("places", n)}>{n === 1 ? "Solo 1.º" : n === 2 ? "1.º y 2.º" : "1.º, 2.º y 3.º"}</button>
              ))}
            </div>
          </Row>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <Clock size={16} /> Duración estimada: <span className="font-semibold text-foreground">≈ {formatDuration(est.minutes)}</span>
        </div>
        <Button size="lg" disabled={tooFew} onClick={() => setConfirming(true)}>
          <Shuffle size={17} /> Revisar y generar
        </Button>
      </div>
      {tooFew && <p className="mt-3 text-[13px] text-destructive">No hay suficientes participantes{settings.onlyPresent ? " con asistencia confirmada" : ""} para generar.</p>}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumen · {category.name}</DialogTitle>
            <DialogDescription>Revisa antes de generar. Quedará en borrador hasta que lo reveles.</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-muted/70 p-5 text-center">
            <div className="text-[13px] font-medium text-muted-foreground">Duración aproximada</div>
            <div className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.04em]">{formatDuration(est.minutes)}</div>
            <div className="mt-2 text-[12px] text-muted-foreground">{est.detail} · con una sola pista</div>
          </div>
          <dl className="divide-y divide-border">
            {summary.map(item => (
              <div key={item.label} className="flex justify-between py-2.5 text-[15px]">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="tabular font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {[
              settings.avoidSameSchool && (kind === "elimination" || kind === "heats") && "Evita mismo colegio",
              kind === "elimination" && (settings.doubleElimination ? "Doble eliminación" : settings.thirdPlace ? "Con 3.er puesto" : "3.er puesto compartido"),
              kind === "elimination" && settings.teamSize === 2 && "Equipos de 2",
              kind === "heats" && `Series de ${settings.heatSize}, pasan ${settings.advancePerHeat}`,
              kind === "timed" && `${settings.attempts} intento(s) · ${settings.timeLimitSec / 60} min`,
              kind === "timed" && settings.finalTopTwo && "Final de los 2 mejores",
              kind !== "elimination" && `${settings.places} puesto(s) premiado(s)`,
            ].filter(Boolean).map(tag => <span key={String(tag)} className="chip"><Users size={12} /> {tag}</span>)}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Volver</Button>
            <Button disabled={busy} onClick={() => void generate()}><Shuffle size={16} /> {busy ? "Generando…" : "Confirmar y generar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
