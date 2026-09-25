import { useEffect, useState } from "react"
import { Hourglass } from "lucide-react"
import { useData } from "@/lib/data"
import { formatLabel } from "@/lib/tournament"
import { PageHeader } from "@/components/page-header"
import { CompetitionView, PodiumStrip, useCompetitionPlaces } from "@/components/competition/competition-view"
import { LiveStreamWidget } from "@/components/live-stream-widget"

const seenKey = (id: string, revealedAt: string | null) => `inedsor_seen_${id}_${revealedAt ?? ""}`
const wasSeen = (key: string) => { try { return localStorage.getItem(key) === "1" } catch { return true } }
const markSeen = (key: string) => { try { localStorage.setItem(key, "1") } catch { /* storage unavailable */ } }

export default function Bracket() {
  const { categories, competitions, liveStreams } = useData()
  const published = competitions.filter(c => c.status !== "draft")
  const [selectedId, setSelectedId] = useState<string>(() => published[0]?.categoryId ?? categories[0]?.id ?? "")

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("category")
    if (id && categories.some(c => c.id === id)) setSelectedId(id)
  }, [categories])

  const category = categories.find(c => c.id === selectedId)
  const competition = published.find(c => c.categoryId === selectedId)
  const places = useCompetitionPlaces(competition)

  const revealKey = competition ? seenKey(competition.id, competition.revealedAt) : null
  const [animateKey, setAnimateKey] = useState<string | null>(null)
  useEffect(() => {
    if (!revealKey || wasSeen(revealKey)) return
    setAnimateKey(revealKey)
    markSeen(revealKey)
  }, [revealKey])

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Competencia" title="Llaves y resultados." description="Los enfrentamientos se publican cuando la organización los revela y se actualizan en vivo." />

      <div className="container-wide">
        <div className="mb-8 flex justify-center">
          <div className="segmented" role="group" aria-label="Categoría">
            {categories.map(c => {
              const s = published.find(x => x.categoryId === c.id)?.status
              return (
                <button key={c.id} type="button" aria-pressed={selectedId === c.id} onClick={() => setSelectedId(c.id)} className="inline-flex items-center gap-2">
                  {s && <span className={`h-2 w-2 rounded-full ${s === "finished" ? "bg-success" : "bg-[hsl(32_95%_50%)] animate-pulse"}`} />}
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>

        {category && !competition && (
          <div className="tile tile-muted mx-auto flex max-w-xl flex-col items-center p-12 text-center">
            <Hourglass size={34} strokeWidth={1.5} className="text-muted-foreground" />
            <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.025em]">{category.name}: aún no publicada.</h2>
            <p className="mt-2 text-muted-foreground">La organización anunciará los enfrentamientos después de la bienvenida. Esta página se actualizará sola.</p>
          </div>
        )}

        {category && competition && (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <h2 className="text-[26px] font-semibold tracking-[-0.03em]">{category.name}</h2>
              <span className="chip">{formatLabel(category.format)}</span>
              <span className={`chip ${competition.status === "finished" ? "bg-success/12 text-success" : "bg-[hsl(32_95%_50%/0.14)] text-[hsl(32_95%_38%)]"}`}>
                {competition.status === "finished" ? "Finalizada" : "En curso"}
              </span>
              <span className="text-[14px] text-muted-foreground">{competition.entrants.length} participantes</span>
            </div>
            {competition.status === "finished" && places && (
              <div className="mb-8"><PodiumStrip places={places} /></div>
            )}
            <CompetitionView key={competition.id} category={category} competition={competition} animateIn={animateKey === revealKey} />
          </>
        )}
      </div>

      <LiveStreamWidget
        streams={liveStreams.filter(s => s.categoryId === selectedId)}
        dismissKey={`torneo:stream-widget-bracket-${selectedId}`}
      />
    </div>
  )
}
