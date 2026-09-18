import { useState, useEffect } from "react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useData } from "@/lib/data"
import { ArrowRight, Trophy, Users, Activity, Building2 } from "lucide-react"
import { InstitutionLogo } from "@/components/institution-logo"

function RollingDigit({ digit }: { digit: string }) {
  // Only valid for digits 0-9
  const num = parseInt(digit, 10);
  if (isNaN(num)) return <span>{digit}</span>;

  return (
    <div className="rolling-digit-container h-[1em] overflow-hidden leading-[1em] align-top relative">
      <div 
        className="transition-transform duration-700 ease-in-out flex flex-col" 
        style={{ transform: `translateY(-${num * 10}%)` }}
      >
        {['0','1','2','3','4','5','6','7','8','9'].map((d) => (
          <div key={d} className="h-full flex items-center justify-center">{d}</div>
        ))}
      </div>
    </div>
  )
}

function RollingNumber({ value, pad = 2 }: { value: number, pad?: number }) {
  const chars = value.toString().padStart(pad, '0').split('');
  return (
    <div className="flex tabular-nums">
      {chars.map((c, i) => <RollingDigit key={i} digit={c} />)}
    </div>
  )
}

export default function Home() {
  const { categories, participants, institutions, rankings } = useData()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

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
    // Target date for countdown (example)
    const target = new Date("2026-11-14T09:00:00-05:00")

    const updateCountdown = () => {
      const now = new Date()
      const diff = Math.max(0, target.getTime() - now.getTime())
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col w-full bg-background">
      {/* Hero Banner Space - Designed to look like a cover image placeholder with CSS Art */}
      <section className="relative w-full overflow-hidden bg-foreground text-background min-h-[50vh] flex flex-col items-center justify-center px-4">
        {/* CSS Abstract Background using brand colors */}
        <div className="absolute inset-0 opacity-90 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-inedsor-blue)] via-foreground to-[var(--color-inedsor-red)] mix-blend-multiply"></div>
          {/* Abstract geometric shapes */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[150%] bg-[var(--color-inedsor-blue)] rotate-12 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] bg-[var(--color-inedsor-red)] -rotate-12 opacity-20 blur-3xl"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto w-full py-20 flex flex-col items-center">
          {/* Subtitle / Context */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border border-white/20 bg-white/10 backdrop-blur-sm font-mono text-sm uppercase tracking-widest text-white mb-8">
            <Building2 className="h-4 w-4" />
            <span>Institución Educativa Soledad Román de Núñez</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-black uppercase leading-[0.9] tracking-tight mb-8 text-white drop-shadow-xl">
            TORNEO<br />INEDSOR
          </h1>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link href="/categorias">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 rounded-none font-bold text-base px-8 h-14">
                VER CATEGORÍAS <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/ranking">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-none font-bold text-base px-8 h-14 bg-transparent backdrop-blur-sm">
                RANKING ACTUAL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Countdown Band */}
      <section className="bg-foreground text-background border-b border-border shadow-md relative z-20">
        <div className="max-w-5xl mx-auto py-6 px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-mono text-sm uppercase tracking-widest opacity-80 whitespace-nowrap">
            La competencia inicia en:
          </div>
          <div className="flex gap-4 md:gap-8 items-center font-mono font-bold text-3xl md:text-5xl">
            <div className="flex flex-col items-center">
              <RollingNumber value={timeLeft.days} pad={3} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1">DÍAS</span>
            </div>
            <span className="opacity-30 mb-5">:</span>
            <div className="flex flex-col items-center">
              <RollingNumber value={timeLeft.hours} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1">HRS</span>
            </div>
            <span className="opacity-30 mb-5">:</span>
            <div className="flex flex-col items-center">
              <RollingNumber value={timeLeft.minutes} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1">MIN</span>
            </div>
            <span className="opacity-30 mb-5">:</span>
            <div className="flex flex-col items-center text-[var(--color-inedsor-red)]">
              <RollingNumber value={timeLeft.seconds} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1">SEG</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-muted/50 transition-colors">
            <div className="bg-[var(--color-inedsor-blue)]/10 p-4 rounded-none text-[var(--color-inedsor-blue)]">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <div className="text-4xl font-serif font-bold">{categories.length}</div>
              <div className="font-mono text-sm uppercase text-muted-foreground font-bold">Categorías</div>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-muted/50 transition-colors">
            <div className="bg-[var(--color-inedsor-red)]/10 p-4 rounded-none text-[var(--color-inedsor-red)]">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <div className="text-4xl font-serif font-bold">{participants.length}</div>
              <div className="font-mono text-sm uppercase text-muted-foreground font-bold">Participantes</div>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-muted/50 transition-colors">
            <div className="bg-foreground/10 p-4 rounded-none text-foreground">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <div className="text-4xl font-serif font-bold">{institutions.length}</div>
              <div className="font-mono text-sm uppercase text-muted-foreground font-bold">Instituciones</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Stacked full-width tables instead of 2 columns */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-16">
        
        {/* Top Instituciones */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b-2 border-foreground pb-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold uppercase flex items-center gap-3">
                Top Instituciones <Trophy className="h-6 w-6 text-tab-rank" />
              </h2>
              <p className="font-mono text-muted-foreground mt-1">Líderes de la competencia actual</p>
            </div>
            <Link href="/ranking">
              <Button variant="outline" className="hidden sm:flex rounded-none border-border">VER RANKING COMPLETO</Button>
            </Link>
          </div>

          <div className="bg-card border border-border shadow-sm overflow-x-auto">
            <table className="table-layout w-full min-w-[920px]">
              <thead>
                <tr>
                  <th className="w-16 text-center">POS</th>
                  <th className="w-20">LOGO</th>
                  <th>INSTITUCIÓN</th>
                  <th className="text-center w-24">ORO</th>
                  <th className="text-center w-24">PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                {topInstitutions.map((row, i) => (
                  <tr key={row.institutionId} className="group hover:bg-muted/30 transition-colors">
                    <td className="text-center font-serif text-2xl font-bold text-muted-foreground">{i + 1}</td>
                    <td className="p-2">
                      <InstitutionLogo 
                        institution={row.institution!} 
                        className="w-12 h-12 border border-border bg-white" 
                        fallbackClassName="text-sm"
                      />
                    </td>
                    <td className="font-bold">
                      <span className="uppercase text-lg">{row.institution!.name}</span>
                      <div className="font-mono text-xs text-muted-foreground mt-1">Coach: {row.institution!.coach || 'N/A'}</div>
                    </td>
                    <td className="text-center font-mono text-xl">{row.gold}</td>
                    <td className="text-center font-mono font-bold text-2xl bg-muted/30">{row.points}</td>
                  </tr>
                ))}
                {topInstitutions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-12 font-mono text-muted-foreground bg-muted/10">Sin puntos registrados en esta edición.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden mt-4">
             <Link href="/ranking">
              <Button variant="outline" className="w-full rounded-none border-border">VER RANKING COMPLETO</Button>
            </Link>
          </div>
        </div>

        {/* Categorías y Programación */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b-2 border-foreground pb-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold uppercase flex items-center gap-3">
                Próximos Encuentros <Activity className="h-6 w-6 text-tab-cat" />
              </h2>
              <p className="font-mono text-muted-foreground mt-1">Programación oficial</p>
            </div>
            <Link href="/categorias">
              <Button variant="outline" className="hidden sm:flex rounded-none border-border">VER TODAS LAS CATEGORÍAS</Button>
            </Link>
          </div>

          <div className="bg-card border border-border shadow-sm overflow-x-auto">
            <table className="table-layout w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-[22%]">CATEGORÍA</th>
                  <th className="w-[14%]">MODALIDAD</th>
                  <th className="w-[49%]">REGLAS BÁSICAS</th>
                  <th className="w-[15%] text-right">HORA INICIO</th>
                </tr>
              </thead>
              <tbody>
                {categories.slice(0, 5).map(cat => (
                  <tr key={cat.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="font-bold">
                      <Link href={`/categorias/${cat.slug}`} className="hover:text-[var(--color-inedsor-blue)] hover:underline uppercase text-lg">
                        {cat.name}
                      </Link>
                    </td>
                    <td className="font-mono uppercase text-xs">
                      <span className="px-2 py-1 bg-muted rounded-none">{cat.format}</span>
                    </td>
                    <td className="text-muted-foreground text-sm whitespace-normal break-words leading-relaxed py-5 pr-8">
                      {cat.rules}
                    </td>
                    <td className="text-right font-mono font-bold text-lg">{cat.startTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </div>
  )
}
