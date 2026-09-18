import { useData } from "@/lib/data"
import { Trophy, Medal, Award, Building2 } from "lucide-react"
import { InstitutionLogo } from "@/components/institution-logo"

export default function Ranking() {
  const { rankings, institutions } = useData()

  const leaderboard = rankings
    .map(r => ({
      ...r,
      institution: institutions.find(i => i.id === r.institutionId),
      points: (r.gold * 10) + (r.silver * 7) + (r.bronze * 5)
    }))
    .filter(r => r.institution)
    .sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)

  return (
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-10 border-b-2 border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-tab-rank/10 text-tab-rank border border-tab-rank/20">
              <Trophy className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-black uppercase text-tab-rank tracking-tight">Clasificación</h1>
          </div>
          <p className="text-lg font-mono text-muted-foreground">
            Ranking oficial por instituciones
          </p>
        </div>
        <div className="bg-muted/30 p-4 font-mono text-sm border-2 border-border">
          <strong className="text-foreground font-black tracking-widest uppercase">Sistema de Puntos:</strong>
          <ul className="mt-3 space-y-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">
            <li className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500"></div> ORO = 10 Pts</li>
            <li className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400"></div> PLATA = 7 Pts</li>
            <li className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-600"></div> BRONCE = 5 Pts</li>
          </ul>
        </div>
      </div>

      <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--color-border)] overflow-x-auto transition-shadow">
        <table className="w-full text-left table-layout">
          <thead>
            <tr className="border-b-2 border-border bg-muted/20">
              <th className="p-4 font-serif text-lg uppercase tracking-widest w-20 text-center border-r border-border text-foreground">POS</th>
              <th className="p-4 font-serif text-lg uppercase tracking-widest border-r border-border text-foreground" colSpan={2}>Institución</th>
              <th className="p-4 font-mono text-xs uppercase text-center w-28 border-r border-border bg-amber-500/10 text-amber-700">Oro</th>
              <th className="p-4 font-mono text-xs uppercase text-center w-28 border-r border-border bg-slate-400/10 text-slate-700">Plata</th>
              <th className="p-4 font-mono text-xs uppercase text-center w-28 border-r border-border bg-orange-600/10 text-orange-700">Bronce</th>
              <th className="p-4 font-serif text-lg uppercase tracking-widest text-center w-32 bg-foreground text-background">PTS</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => (
              <tr 
                key={row.institutionId} 
                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group"
              >
                <td className="p-4 text-center border-r border-border">
                  <div className="font-serif text-2xl font-bold flex flex-col items-center text-muted-foreground group-hover:text-tab-rank transition-colors">
                    {index === 0 && <Trophy className="h-5 w-5 text-amber-500 mb-1" />}
                    {index === 1 && <Medal className="h-5 w-5 text-slate-400 mb-1" />}
                    {index === 2 && <Award className="h-5 w-5 text-orange-600 mb-1" />}
                    <span>{index + 1}</span>
                  </div>
                </td>
                <td className="p-4 w-24 text-center">
                  <InstitutionLogo 
                    institution={row.institution!} 
                    className="w-12 h-12 mx-auto border-2 border-border group-hover:border-tab-rank/50 transition-colors bg-white"
                  />
                </td>
                <td className="p-4 border-r border-border">
                  <div className="font-bold text-xl uppercase tracking-tight group-hover:text-tab-rank transition-colors">{row.institution!.name}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1 flex gap-4">
                    <span><strong>SIGLA:</strong> {row.institution!.initials}</span>
                    <span><strong>COACH:</strong> {row.institution!.coach || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-4 text-center font-mono text-2xl font-bold border-r border-border text-amber-600">{row.gold}</td>
                <td className="p-4 text-center font-mono text-2xl font-bold border-r border-border text-slate-500">{row.silver}</td>
                <td className="p-4 text-center font-mono text-2xl font-bold border-r border-border text-orange-600">{row.bronze}</td>
                <td className="p-4 text-center font-serif text-3xl font-black bg-muted/10 group-hover:bg-tab-rank/10 transition-colors text-foreground group-hover:text-tab-rank">{row.points}</td>
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
