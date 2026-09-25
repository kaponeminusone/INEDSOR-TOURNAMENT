import { useEffect, useState } from "react"
import { Eye, Flag, RotateCcw, Trash2 } from "lucide-react"
import { useData } from "@/lib/data"
import { formatDuration } from "@/lib/competition"
import { formatLabel } from "@/lib/tournament"
import { Button } from "@/components/ui/button"
import { ControlHeader } from "@/components/page-header"
import { CompetitionGenerator } from "@/components/competition/generator"
import { CompetitionView, PodiumStrip, useCompetitionPlaces } from "@/components/competition/competition-view"
import { EditModeToggle } from "@/components/competition/edit-mode-toggle"

const statusChip = {
  none: { label: "Sin generar", className: "bg-muted text-muted-foreground" },
  draft: { label: "Borrador", className: "bg-[hsl(265_70%_55%/0.12)] text-[hsl(265_60%_48%)]" },
  revealed: { label: "En curso", className: "bg-[hsl(32_95%_50%/0.14)] text-[hsl(32_95%_38%)]" },
  finished: { label: "Finalizada", className: "bg-success/12 text-success" },
}

export default function ControlCompetencia() {
  const { categories, competitions, editModeUntil, revealCompetition, discardCompetition, finishCompetition, reopenCompetition } = useData()
  const [selectedId, setSelectedId] = useState<string>(categories[0]?.id ?? "")
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("category")
    if (id && categories.some(c => c.id === id)) setSelectedId(id)
  }, [categories])

  const category = categories.find(c => c.id === selectedId)
  const competition = competitions.find(c => c.categoryId === selectedId)
  const places = useCompetitionPlaces(competition)
  const status = competition?.status ?? "none"
  const editMode = Boolean(editModeUntil)

  const confirmThen = (message: string, action: () => void) => { if (window.confirm(message)) action() }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader title="Competencia" description="Genera, revela y registra los resultados de cada categoría." actions={<EditModeToggle />} />

      <div className="segmented mb-8" role="group" aria-label="Categoría">
        {categories.map(c => {
          const s = competitions.find(x => x.categoryId === c.id)?.status ?? "none"
          return (
            <button key={c.id} type="button" aria-pressed={selectedId === c.id} onClick={() => setSelectedId(c.id)} className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${s === "finished" ? "bg-success" : s === "revealed" ? "bg-[hsl(32_95%_50%)]" : s === "draft" ? "bg-[hsl(265_70%_55%)]" : "bg-foreground/20"}`} />
              {c.name}
            </button>
          )
        })}
      </div>

      {category && (
        <>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[28px] font-semibold tracking-[-0.03em]">{category.name}</h2>
                <span className="chip">{formatLabel(category.format)}</span>
                <span className={`chip ${statusChip[status].className}`}>{statusChip[status].label}</span>
              </div>
              {competition?.estimateMinutes != null && (
                <p className="mt-1 text-[14px] text-muted-foreground">{competition.entrants.length} participantes · duración estimada ≈ {formatDuration(competition.estimateMinutes)}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {competition && status === "draft" && (
                <>
                  <Button variant="secondary" onClick={() => confirmThen("¿Descartar este borrador? Podrás generar uno nuevo.", () => void discardCompetition(competition.id))}><Trash2 size={16} /> Descartar</Button>
                  <Button onClick={() => void revealCompetition(competition.id)}><Eye size={16} /> Revelar al público</Button>
                </>
              )}
              {competition && status === "revealed" && category.format !== "direct" && (
                <Button disabled={!places} onClick={() => places && confirmThen("¿Finalizar la categoría? El podio se sumará al ranking y los resultados quedarán cerrados.", () => void finishCompetition(competition, places))}>
                  <Flag size={16} /> Finalizar categoría
                </Button>
              )}
              {competition && status === "finished" && editMode && (
                <Button variant="outline" onClick={() => confirmThen("¿Reabrir la categoría? Su podio dejará de contar en el ranking hasta que la finalices de nuevo.", () => void reopenCompetition(competition))}><RotateCcw size={16} /> Reabrir</Button>
              )}
              {competition && status !== "draft" && editMode && (
                <Button variant="destructive" onClick={() => confirmThen("¿Eliminar esta competencia y todos sus resultados? Esta acción no se puede deshacer.", () => void discardCompetition(competition.id))}><Trash2 size={16} /> Eliminar competencia</Button>
              )}
            </div>
          </div>

          {status === "draft" && (
            <p className="mb-6 rounded-2xl bg-[hsl(265_70%_55%/0.08)] px-4 py-3 text-[14px] text-foreground/80">
              <span className="font-semibold">Borrador:</span> solo lo ven los organizadores. Revísalo y pulsa «Revelar al público» para anunciarlo; los resultados se registran después de revelarlo.
            </p>
          )}

          {places && status !== "draft" && (
            <div className="mb-8">
              <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{status === "finished" ? "Podio final" : "Podio (pendiente de finalizar)"}</h3>
              <PodiumStrip places={places} />
            </div>
          )}

          {!competition ? (
            <CompetitionGenerator key={category.id} category={category} />
          ) : (
            <CompetitionView category={category} competition={competition} editable={status !== "draft"} />
          )}
        </>
      )}
    </div>
  )
}
