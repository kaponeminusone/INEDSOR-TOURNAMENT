import { Link } from "wouter"
import { Activity, CheckCircle2, ChevronRight, Cpu, Swords, UserCheck, Users } from "lucide-react"
import { useData } from "@/lib/data"
import { resolveMatches, type Competition } from "@/lib/competition"
import { ControlHeader } from "@/components/page-header"

export default function ControlDashboard() {
  const { categories, participants, competitions, competitionMatches, competitionRuns, robots } = useData()

  // Encuentros jugables (sin byes ni finales extra no necesarias) y su avance por competencia.
  const progressOf = (competition: Competition | undefined) => {
    if (!competition) return { done: 0, total: 0 }
    if (competition.kind === "timed") {
      const runs = competitionRuns.filter(r => r.competitionId === competition.id)
      return { done: runs.length, total: competition.entrants.length * competition.settings.attempts }
    }
    if (competition.kind === "direct") return { done: competition.status === "finished" ? 1 : 0, total: 1 }
    const resolved = [...resolveMatches(competitionMatches.filter(m => m.competitionId === competition.id)).values()]
    const playable = resolved.filter(m => m.state !== "bye" && m.state !== "skipped")
    return { done: playable.filter(m => m.state === "done").length, total: playable.length }
  }
  const totals = competitions.map(progressOf).reduce((acc, p) => ({ done: acc.done + p.done, total: acc.total + p.total }), { done: 0, total: 0 })
  const activeMatches = competitionMatches.filter(m => m.status === "active").length
  const completedMatches = totals.done
  const attendedCount = participants.filter(p => p.attendedAt).length
  const attendanceRate = participants.length > 0 ? Math.round((attendedCount / participants.length) * 100) : 0

  const stats = [
    { label: "Encuentros en pista", value: String(activeMatches), icon: Activity, tone: "text-[hsl(32_95%_45%)]", live: activeMatches > 0 },
    { label: "Partidas finalizadas", value: `${completedMatches}/${totals.total}`, icon: CheckCircle2, tone: "text-success" },
    { label: "Asistencia", value: `${attendanceRate}%`, hint: `${attendedCount} de ${participants.length} confirmados`, icon: Users, tone: "text-primary" },
    { label: "Robots registrados", value: String(robots.length), icon: Cpu, tone: "text-[hsl(265_70%_55%)]" },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader title="Resumen" description="Estado operativo del evento en tiempo real." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon size={17} className={`${stat.tone} ${stat.live ? "animate-pulse" : ""}`} />
            </div>
            <div className="mt-4 text-[34px] font-semibold leading-none tracking-[-0.04em]">{stat.value}</div>
            {stat.hint && <div className="mt-2 text-[12px] text-muted-foreground">{stat.hint}</div>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-6">
          <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Progreso por categoría</h2>
          <ul className="mt-5 space-y-4">
            {categories.map(cat => {
              const competition = competitions.find(c => c.categoryId === cat.id)
              const { done: completed, total } = progressOf(competition)
              const progress = competition?.status === "finished" ? 100 : total > 0 ? (completed / total) * 100 : 0
              const label = !competition ? "Sin generar" : competition.status === "draft" ? "Borrador" : competition.status === "finished" ? "Finalizada" : `${completed}/${total}`
              return (
                <li key={cat.id}>
                  <div className="mb-1.5 flex justify-between text-[14px]">
                    <span className="font-medium">{cat.name}</span>
                    <span className="tabular text-muted-foreground">{label}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="sr-only">Acciones rápidas</h2>
          {[
            { href: "/control/asistencia", title: "Registro de asistencia", text: "Marca la llegada de delegaciones y valida inscripciones.", icon: UserCheck },
            { href: "/control/competencia", title: "Llamado a pista", text: "Inicia encuentros y registra resultados.", icon: Swords },
          ].map(action => (
            <Link key={action.href} href={action.href} className="panel group flex items-center gap-4 p-5 transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,.18)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <action.icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold tracking-[-0.015em]">{action.title}</span>
                <span className="block text-[14px] text-muted-foreground">{action.text}</span>
              </span>
              <ChevronRight size={18} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}
