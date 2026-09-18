import { useData } from "@/lib/data"
import { Trophy, Medal, Award } from "lucide-react"
import { InstitutionLogo } from "@/components/institution-logo"

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
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase mb-4 text-tab-rank">Clasificación</h1>
          <p className="text-xl font-mono text-muted-foreground">
            Ranking oficial por instituciones
          </p>
        </div>
        <div className="bg-muted p-4 font-mono text-sm border border-border">
          <strong className="text-foreground">SISTEMA DE PUNTOS:</strong>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500"></div> ORO = 10 Pts</li>
            <li className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400"></div> PLATA = 7 Pts</li>
            <li className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-600"></div> BRONCE = 5 Pts</li>
          </ul>
        </div>
      </div>

      <div className="border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-left table-layout">
          <thead>
            <tr className="border-b-2 border-foreground bg-muted/50">
              <th className="p-4 font-serif text-xl uppercase tracking-widest w-24 text-center border-r border-border">POS</th>
              <th className="p-4 font-serif text-xl uppercase tracking-widest border-r border-border" colSpan={2}>Institución</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-28 border-r border-border bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400">Oro</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-28 border-r border-border bg-slate-200 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300">Plata</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-28 border-r border-border bg-orange-200 text-orange-900 dark:bg-orange-900/30 dark:text-orange-400">Bronce</th>
              <th className="p-4 font-serif text-xl uppercase tracking-widest text-center w-32 bg-foreground text-background">PTS</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => (
              <tr 
                key={row.institutionId} 
                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="p-4 text-center border-r border-border">
                  <div className="font-serif text-3xl font-bold flex flex-col items-center">
                    {index === 0 && <Trophy className="h-6 w-6 text-amber-500 mb-1" />}
                    {index === 1 && <Medal className="h-6 w-6 text-slate-400 mb-1" />}
                    {index === 2 && <Award className="h-6 w-6 text-orange-500 mb-1" />}
                    {index + 1}
                  </div>
                </td>
                <td className="p-4 w-24 text-center">
                  <InstitutionLogo 
                    institution={row.institution!} 
                    className="w-16 h-16 mx-auto border border-border"
                  />
                </td>
                <td className="p-4 border-r border-border">
                  <div className="font-bold text-2xl uppercase tracking-tight">{row.institution!.name}</div>
                  <div className="font-mono text-sm text-muted-foreground mt-1 flex gap-4">
                    <span><strong>SIGLA:</strong> {row.institution!.initials}</span>
                    <span><strong>COACH:</strong> {row.institution!.coach || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-4 text-center font-mono text-3xl font-bold border-r border-border text-amber-600 dark:text-amber-500">{row.gold}</td>
                <td className="p-4 text-center font-mono text-3xl font-bold border-r border-border text-slate-500 dark:text-slate-400">{row.silver}</td>
                <td className="p-4 text-center font-mono text-3xl font-bold border-r border-border text-orange-600 dark:text-orange-500">{row.bronze}</td>
                <td className="p-4 text-center font-serif text-4xl font-black bg-muted/30">{row.points}</td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={7} className="p-16 text-center font-mono text-muted-foreground text-lg">
                  Aún no hay puntuaciones registradas en la competencia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
