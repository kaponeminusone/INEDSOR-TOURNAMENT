import { useMemo } from "react"
import { Trophy } from "lucide-react"
import { useData, type Category } from "@/lib/data"
import { eliminationPlaces, heatsPlaces, resolveMatches, timedPlaces, type Competition, type Places } from "@/lib/competition"
import { EliminationBoard } from "@/components/competition/elimination-board"
import { HeatsBoard } from "@/components/competition/heats-board"
import { TimedBoard } from "@/components/competition/timed-board"
import { DirectBoard } from "@/components/competition/direct-board"

export function useCompetitionPlaces(competition: Competition | undefined): Places | null {
  const { competitionMatches, competitionRuns, categoryResults } = useData()
  return useMemo(() => {
    if (!competition) return null
    const saved = categoryResults.find(r => r.categoryId === competition.categoryId)
    if (competition.kind === "direct") return saved?.places ?? null
    const matches = competitionMatches.filter(m => m.competitionId === competition.id)
    if (competition.kind === "elimination") return eliminationPlaces(matches, resolveMatches(matches))
    if (competition.kind === "heats") return matches.length ? heatsPlaces(matches, resolveMatches(matches), competition.settings.places) : null
    return timedPlaces(competition.entrants, competitionRuns.filter(r => r.competitionId === competition.id), competition.settings).places
  }, [competition, competitionMatches, competitionRuns, categoryResults])
}

export function PodiumStrip({ places }: { places: Places }) {
  const { describeEntrant } = useData()
  const color = ["text-gold", "text-silver", "text-bronze"]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {places.slice(0, 3).map((keys, i) => (
        <div key={i} className="tile tile-muted flex items-center gap-3 p-4">
          <Trophy size={22} className={`shrink-0 ${color[i]}`} />
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-muted-foreground">{i + 1}.º lugar</div>
            {keys.map(k => (
              <div key={k} className="truncate text-[15px] font-semibold tracking-[-0.015em]">{describeEntrant(k).name}</div>
            ))}
            <div className="truncate text-[12px] text-muted-foreground">{keys.map(k => describeEntrant(k).schoolInitials).join(" · ")}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CompetitionView({ category, competition, editable, animateIn }: { category: Category; competition: Competition; editable?: boolean; animateIn?: boolean }) {
  const data = useData()
  const editMode = Boolean(data.editModeUntil)
  const matches = data.competitionMatches.filter(m => m.competitionId === competition.id)
  const runs = data.competitionRuns.filter(r => r.competitionId === competition.id)
  const saved = data.categoryResults.find(r => r.categoryId === category.id)

  if (competition.kind === "elimination") {
    return <EliminationBoard matches={matches} describe={data.describeEntrant} editable={editable} editMode={editMode} animateIn={animateIn}
      onWinner={(id, key) => void data.setMatchWinner(id, key)} onActive={(id, active) => void data.setMatchActive(id, active)} />
  }
  if (competition.kind === "heats") {
    return <HeatsBoard matches={matches} settings={competition.settings} describe={data.describeEntrant} editable={editable} editMode={editMode} animateIn={animateIn}
      onPlacements={(id, placements) => void data.setHeatPlacements(id, placements)} onActive={(id, active) => void data.setMatchActive(id, active)} />
  }
  if (competition.kind === "timed") {
    return <TimedBoard competition={competition} runs={runs} categoryName={category.name} describe={data.describeEntrant} editable={editable} editMode={editMode} animateIn={animateIn}
      onRecord={data.recordRun} onDeleteRun={id => void data.deleteRun(id)} />
  }
  return <DirectBoard key={saved?.recordedAt ?? "none"} competition={competition} places={saved?.places ?? null} describe={data.describeEntrant} editable={editable} editMode={editMode}
    onSave={places => void data.finishCompetition(competition, places)} />
}
