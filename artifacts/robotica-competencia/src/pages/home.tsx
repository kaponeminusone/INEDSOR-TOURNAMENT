import { useState, useEffect } from "react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useData } from "@/lib/data"
import { ArrowRight, Trophy, Users, Activity } from "lucide-react"

export default function Home() {
  const { categories, participants, institutions, rankings } = useData()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })

  // Calculate points for home
  const topInstitutions = rankings
    .map(r => ({
      ...r,
      institution: institutions.find(i => i.id === r.institutionId),
      points: (r.gold * 10) + (r.silver * 7) + (r.bronze * 5)
    }))
    .filter(r => r.institution)
    .sort((a, b) => b.points - a.points || b.gold - a.gold)
    .slice(0, 5)

  useEffect(() => {
    const target = new Date("2026-11-14T09:00:00-05:00")

    const updateCountdown = () => {
      const now = new Date()
      const diff = Math.max(0, target.getTime() - now.getTime())
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 30_000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="border-b-2 border-foreground relative overflow-hidden bg-foreground text-background py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-mono text-xl mb-4 opacity-80 uppercase tracking-widest">Torneo Nacional</div>
            <h1 className="text-6xl md:text-8xl font-serif font-black uppercase leading-none mb-6">
              BATALLA<br/>DE<br/>CÓDIGO
            </h1>
            <p className="text-xl font-mono mb-8 opacity-90 max-w-md">
              Plataforma oficial de competencia. Resultados en tiempo real, llaves de torneo y estadísticas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/categorias">
                <Button variant="outline" size="lg" className="bg-background text-foreground border-background hover:bg-transparent hover:text-background hover:border-background">
                  VER CATEGORÍAS <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/bracket">
                <Button variant="outline" size="lg" className="border-background text-background hover:bg-background hover:text-foreground">
                  LLAVES EN VIVO
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <div className="border-4 border-background p-8 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-background/5 -z-10 pattern-dots"></div>
              <div className="font-mono text-sm uppercase mb-2">Comienza en</div>
              <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums">
                {String(timeLeft.days).padStart(2, "0")}:{String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="flex justify-between font-mono text-xs uppercase mt-2 opacity-70">
                <span>Días</span>
                <span>Horas</span>
                <span>Minutos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="border-b-2 border-foreground bg-muted/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-foreground">
          <div className="p-8 flex items-center gap-4">
            <Trophy className="h-10 w-10 text-foreground" />
            <div>
              <div className="text-4xl font-serif font-bold">{categories.length}</div>
              <div className="font-mono text-sm uppercase text-muted-foreground">Categorías</div>
            </div>
          </div>
          <div className="p-8 flex items-center gap-4">
            <Users className="h-10 w-10 text-foreground" />
            <div>
              <div className="text-4xl font-serif font-bold">{participants.length}</div>
              <div className="font-mono text-sm uppercase text-muted-foreground">Competidores</div>
            </div>
          </div>
          <div className="p-8 flex items-center gap-4">
            <Activity className="h-10 w-10 text-foreground" />
            <div>
              <div className="text-4xl font-serif font-bold">{institutions.length}</div>
              <div className="font-mono text-sm uppercase text-muted-foreground">Instituciones</div>
            </div>
          </div>
        </div>
      </section>

      {/* En vivo */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-serif font-bold uppercase mb-2">Estado del Evento</h2>
            <p className="font-mono text-muted-foreground">Monitoreo en tiempo real</p>
          </div>
          <Link href="/ranking">
            <Button variant="outline" className="hidden sm:flex">VER RANKING COMPLETO</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <div className="p-6 border-b-2 border-foreground bg-foreground text-background flex justify-between items-center">
              <h3 className="font-serif text-xl uppercase font-bold">Top Instituciones</h3>
              <Trophy className="h-5 w-5" />
            </div>
            <div className="p-0">
              <table className="table-layout">
                <thead>
                  <tr>
                    <th>Institución</th>
                    <th className="text-center w-16">Oro</th>
                    <th className="text-center w-16">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {topInstitutions.map((row, i) => (
                    <tr key={row.institutionId} className="group hover:bg-muted/50 transition-colors">
                      <td className="font-bold flex items-center gap-3">
                        <span className="font-mono text-muted-foreground w-4">{i + 1}.</span>
                        {row.institution!.initials} - {row.institution!.name}
                      </td>
                      <td className="text-center font-mono">{row.gold}</td>
                      <td className="text-center font-mono font-bold bg-muted/30">{row.points}</td>
                    </tr>
                  ))}
                  {topInstitutions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center p-8 font-mono text-muted-foreground">Sin puntos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b-2 border-foreground flex justify-between items-center">
              <h3 className="font-serif text-xl uppercase font-bold">Siguientes Encuentros</h3>
              <Activity className="h-5 w-5" />
            </div>
            <div className="p-0">
              <table className="table-layout">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Fase</th>
                    <th className="text-right">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.slice(0, 4).map(cat => (
                    <tr key={cat.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="font-bold">
                        <Link href={`/categorias/${cat.slug}`} className="hover:underline">
                          {cat.name}
                        </Link>
                      </td>
                      <td className="font-mono text-muted-foreground">Eliminatorias</td>
                      <td className="text-right font-mono font-bold">{cat.startTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
