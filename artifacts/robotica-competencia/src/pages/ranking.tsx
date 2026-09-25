import { Trophy } from "lucide-react"
import { useData } from "@/lib/data"
import { buildLeaderboard, POINTS } from "@/lib/tournament"
import { InstitutionLogo } from "@/components/institution-logo"
import { PageHeader } from "@/components/page-header"
import { Reveal } from "@/components/reveal"

const medalColor = ["text-gold", "text-silver", "text-bronze"]
const podiumOrder = [1, 0, 2]
const podiumHeight = ["md:min-h-[340px]", "md:min-h-[300px]", "md:min-h-[270px]"]

export default function Ranking() {
  const { rankings, institutions } = useData()
  const leaderboard = buildLeaderboard(rankings, institutions)
  const podium = podiumOrder.map(i => leaderboard[i] ? { row: leaderboard[i], place: i } : null).filter(Boolean) as { row: typeof leaderboard[number]; place: number }[]

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Ranking"
        title="Clasificación."
        description="Medallero por institución. Cada podio suma puntos al colegio del robot."
        actions={
          <div className="flex flex-wrap gap-2">
            <span className="chip"><span className="h-2 w-2 rounded-full bg-gold" /> Oro · {POINTS.gold} pts</span>
            <span className="chip"><span className="h-2 w-2 rounded-full bg-silver" /> Plata · {POINTS.silver} pts</span>
            <span className="chip"><span className="h-2 w-2 rounded-full bg-bronze" /> Bronce · {POINTS.bronze} pts</span>
          </div>
        }
      />

      <div className="container-apple">
        <p className="-mt-4 mb-8 text-[13px] text-muted-foreground">
          El reglamento oficial no define un sistema de puntos por institución; esta tabla es orientativa hasta que la organización lo confirme.
        </p>
        {leaderboard.length === 0 ? (
          <div className="tile tile-muted p-16 text-center text-muted-foreground">Aún no hay puntuaciones registradas en la competencia.</div>
        ) : (
          <>
            <div className="grid items-end gap-4 md:grid-cols-3">
              {podium.map(({ row, place }, i) => (
                <Reveal key={row.institutionId} delay={i * 0.1} className={place === 0 ? "order-first md:order-none" : ""}>
                  <div className={`tile flex flex-col items-center justify-end p-8 text-center ${place === 0 ? "bg-foreground text-background" : "tile-muted"} ${podiumHeight[place]}`}>
                    <Trophy size={place === 0 ? 30 : 24} className={medalColor[place]} strokeWidth={1.8} />
                    <InstitutionLogo institution={row.institution} className={`mt-5 h-16 w-16 shrink-0 rounded-2xl text-[16px] ${place === 0 ? "bg-white/10 text-white" : "bg-card"}`} />
                    <h2 className="mt-4 text-[19px] font-semibold leading-tight tracking-[-0.02em]">{row.institution.name}</h2>
                    <div className="mt-3 text-[40px] font-semibold leading-none tracking-[-0.045em]">{row.points}</div>
                    <div className={`mt-1 text-[13px] ${place === 0 ? "text-white/60" : "text-muted-foreground"}`}>puntos · {place + 1}.º lugar</div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-14">
              <h2 className="headline-md mb-6">Tabla completa.</h2>
              <div className="overflow-x-auto rounded-[22px] border border-border">
                <table className="table-apple min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="w-16 text-center">#</th>
                      <th>Institución</th>
                      <th className="w-24 text-center">Oro</th>
                      <th className="w-24 text-center">Plata</th>
                      <th className="w-24 text-center">Bronce</th>
                      <th className="w-28 text-right">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, index) => (
                      <tr key={row.institutionId}>
                        <td className="text-center text-[17px] font-semibold text-muted-foreground">{index + 1}</td>
                        <td>
                          <div className="flex items-center gap-3.5">
                            <InstitutionLogo institution={row.institution} className="h-10 w-10 shrink-0 rounded-xl text-[12px]" />
                            <div className="min-w-0">
                              <div className="font-semibold tracking-[-0.015em]">{row.institution.name}</div>
                              <div className="text-[13px] text-muted-foreground">{row.institution.initials} · Coach: {row.institution.coach || "Sin asignar"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="tabular text-center">{row.gold}</td>
                        <td className="tabular text-center">{row.silver}</td>
                        <td className="tabular text-center">{row.bronze}</td>
                        <td className="tabular text-right text-[19px] font-semibold tracking-[-0.02em]">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </div>
  )
}
