import { useData } from "@/lib/data"
import { Trophy, Medal, Award } from "lucide-react"

export default function Ranking() {
  const { rankings, institutions } = useData()

  // Enriched ranking
  const leaderboard = rankings
    .map(r => ({
      ...r,
      institution: institutions.find(i => i.id === r.institutionId),
      points: (r.gold * 10) + (r.silver * 7) + (r.bronze * 5)
    }))
    .filter(r => r.institution) // ensure relation exists
    .sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 border-b-4 border-foreground pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase mb-4">Clasificación</h1>
          <p className="text-xl font-mono text-muted-foreground">
            Ranking oficial por instituciones
          </p>
        </div>
        <div className="bg-foreground text-background p-4 font-mono text-sm">
          <strong>SISTEMA DE PUNTOS:</strong>
          <ul className="mt-2 space-y-1 opacity-90">
            <li>ORO = 10 Puntos</li>
            <li>PLATA = 7 Puntos</li>
            <li>BRONCE = 5 Puntos</li>
          </ul>
        </div>
      </div>

      <div className="border-4 border-foreground bg-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-4 border-foreground bg-muted">
              <th className="p-4 font-serif text-xl uppercase tracking-widest w-24 text-center border-r-2 border-foreground">POS</th>
              <th className="p-4 font-serif text-xl uppercase tracking-widest border-r-2 border-foreground">Institución</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-24 border-r-2 border-foreground bg-amber-200/20 text-amber-700 dark:text-amber-500">Oro</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-24 border-r-2 border-foreground bg-slate-300/20 text-slate-600 dark:text-slate-400">Plata</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-24 border-r-2 border-foreground bg-orange-300/20 text-orange-700 dark:text-orange-500">Bronce</th>
              <th className="p-4 font-serif text-xl uppercase tracking-widest text-center w-32 bg-foreground text-background">PTS</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => (
              <tr 
                key={row.institutionId} 
                className="border-b-2 border-foreground last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="p-4 text-center border-r-2 border-foreground">
                  <div className="font-serif text-3xl font-bold">
                    {index === 0 && <Trophy className="inline-block h-8 w-8 text-amber-500 mr-2" />}
                    {index === 1 && <Medal className="inline-block h-8 w-8 text-slate-400 mr-2" />}
                    {index === 2 && <Award className="inline-block h-8 w-8 text-orange-500 mr-2" />}
                    {index + 1}
                  </div>
                </td>
                <td className="p-4 border-r-2 border-foreground">
                  <div className="font-bold text-xl uppercase">{row.institution!.name}</div>
                  <div className="font-mono text-sm text-muted-foreground mt-1">
                    Coach: {row.institution!.coach}
                  </div>
                </td>
                <td className="p-4 text-center font-mono text-2xl font-bold border-r-2 border-foreground">{row.gold}</td>
                <td className="p-4 text-center font-mono text-2xl font-bold border-r-2 border-foreground">{row.silver}</td>
                <td className="p-4 text-center font-mono text-2xl font-bold border-r-2 border-foreground">{row.bronze}</td>
                <td className="p-4 text-center font-serif text-3xl font-black bg-muted/50">{row.points}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center font-mono text-muted-foreground">
                  Aún no hay puntuaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
