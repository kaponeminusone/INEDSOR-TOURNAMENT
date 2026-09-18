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
      <div className="mb-12 border-b-4 border-tab-rank pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-tab-rank text-background">
              <Trophy className="h-10 w-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase text-tab-rank tracking-tight">Clasificación</h1>
          </div>
          <p className="text-xl font-mono text-muted-foreground">
            Ranking oficial por instituciones
          </p>
        </div>
        <div className="bg-tab-rank/10 p-4 font-mono text-sm border-2 border-tab-rank/20">
          <strong className="text-tab-rank font-black tracking-widest uppercase">Sistema de Puntos:</strong>
          <ul className="mt-3 space-y-2 text-foreground font-bold text-xs uppercase tracking-wider">
            <li className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-500 border border-amber-600"></div> ORO = 10 Pts</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-400 border border-slate-500"></div> PLATA = 7 Pts</li>
            <li className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-600 border border-orange-700"></div> BRONCE = 5 Pts</li>
          </ul>
        </div>
      </div>

      <div className="border-2 border-border bg-card shadow-[8px_8px_0px_0px_var(--color-tab-rank)] overflow-x-auto transition-shadow">
        <table className="w-full text-left table-layout">
          <thead>
            <tr className="border-b-2 border-tab-rank bg-tab-rank/10">
              <th className="p-4 font-serif text-xl uppercase tracking-widest w-24 text-center border-r border-border text-tab-rank">POS</th>
              <th className="p-4 font-serif text-xl uppercase tracking-widest border-r border-border text-tab-rank" colSpan={2}>Institución</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-28 border-r border-border bg-amber-500 text-amber-950">Oro</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-28 border-r border-border bg-slate-400 text-slate-900">Plata</th>
              <th className="p-4 font-mono text-sm uppercase text-center w-28 border-r border-border bg-orange-600 text-orange-50">Bronce</th>
              <th className="p-4 font-serif text-xl uppercase tracking-widest text-center w-32 bg-tab-rank text-background">PTS</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => (
              <tr 
                key={row.institutionId} 
                className="border-b border-border last:border-b-0 hover:bg-tab-rank/5 transition-colors group"
              >
                <td className="p-4 text-center border-r border-border">
                  <div className="font-serif text-3xl font-bold flex flex-col items-center text-muted-foreground group-hover:text-tab-rank transition-colors">
                    {index === 0 && <Trophy className="h-6 w-6 text-amber-500 mb-1" />}
                    {index === 1 && <Medal className="h-6 w-6 text-slate-400 mb-1" />}
                    {index === 2 && <Award className="h-6 w-6 text-orange-600 mb-1" />}
                    <span>{index + 1}</span>
                  </div>
                </td>
                <td className="p-4 w-24 text-center">
                  <InstitutionLogo 
                    institution={row.institution!} 
                    className="w-16 h-16 mx-auto border-2 border-border group-hover:border-tab-rank transition-colors bg-white"
                  />
                </td>
                <td className="p-4 border-r border-border">
                  <div className="font-bold text-2xl uppercase tracking-tight group-hover:text-tab-rank transition-colors">{row.institution!.name}</div>
                  <div className="font-mono text-sm text-muted-foreground mt-1 flex gap-4">
                    <span><strong>SIGLA:</strong> {row.institution!.initials}</span>
                    <span><strong>COACH:</strong> {row.institution!.coach || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-4 text-center font-mono text-3xl font-bold border-r border-border text-amber-600 bg-amber-500/5">{row.gold}</td>
                <td className="p-4 text-center font-mono text-3xl font-bold border-r border-border text-slate-500 bg-slate-400/5">{row.silver}</td>
                <td className="p-4 text-center font-mono text-3xl font-bold border-r border-border text-orange-600 bg-orange-600/5">{row.bronze}</td>
                <td className="p-4 text-center font-serif text-4xl font-black bg-tab-rank/5 group-hover:bg-tab-rank/20 transition-colors text-tab-rank">{row.points}</td>
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
