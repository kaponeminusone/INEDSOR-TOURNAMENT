import { useState, useEffect } from "react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data"
import { ArrowRight, Trophy, Users, Activity, Building2, Layers } from "lucide-react"
import { InstitutionLogo } from "@/components/institution-logo"

function RollingDigit({ digit }: { digit: string }) {
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
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col w-full bg-background">
      <section className="relative w-full overflow-hidden bg-foreground text-background min-h-[50vh] flex flex-col items-center justify-center px-4">
        <div className="absolute inset-0 opacity-90 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-inedsor-blue)] via-foreground to-[var(--color-inedsor-red)] mix-blend-multiply"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[150%] bg-[var(--color-inedsor-blue)] rotate-12 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] bg-[var(--color-inedsor-red)] -rotate-12 opacity-20 blur-3xl"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto w-full py-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border border-white/20 bg-white/10 backdrop-blur-sm font-mono text-sm uppercase tracking-widest text-white mb-8 shadow-sm">
            <Building2 className="h-4 w-4" />
            <span>Institución Educativa Soledad Román de Núñez</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif font-black uppercase leading-[0.9] tracking-tight mb-8 text-white drop-shadow-2xl">
            TORNEO<br />INEDSOR
          </h1>

          <div className="flex flex-wrap justify-center gap-4 mt-4 w-full px-4 sm:px-0">
            <Link href="/categorias" className="block w-full sm:w-auto">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 rounded-none font-bold text-base px-8 h-14 w-full sm:w-auto">
                VER CATEGORÍAS <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/ranking" className="block w-full sm:w-auto">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-none font-bold text-base px-8 h-14 bg-transparent backdrop-blur-sm w-full sm:w-auto">
                RANKING ACTUAL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background border-b border-border shadow-md relative z-20">
        <div className="max-w-5xl mx-auto py-6 px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-mono text-sm uppercase tracking-widest opacity-80 whitespace-nowrap font-bold">
            La competencia inicia en:
          </div>
          <div className="flex gap-4 md:gap-8 items-center font-mono font-bold text-3xl md:text-5xl md:pl-12 lg:pl-20">
            <div className="flex flex-col items-center">
              <RollingNumber value={timeLeft.days} pad={3} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1 tracking-widest">DÍAS</span>
            </div>
            <span className="opacity-30 mb-5">:</span>
            <div className="flex flex-col items-center">
              <RollingNumber value={timeLeft.hours} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1 tracking-widest">HRS</span>
            </div>
            <span className="opacity-30 mb-5">:</span>
            <div className="flex flex-col items-center">
              <RollingNumber value={timeLeft.minutes} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1 tracking-widest">MIN</span>
            </div>
            <span className="opacity-30 mb-5">:</span>
            <div className="flex flex-col items-center text-tab-cat">
              <RollingNumber value={timeLeft.seconds} />
              <span className="text-[10px] md:text-xs opacity-50 mt-1 tracking-widest text-foreground">SEG</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-tab-cat/5 transition-colors">
            <div className="bg-tab-cat/10 p-4 rounded-none text-tab-cat transition-transform group-hover:scale-110">
              <Layers className="h-8 w-8" />
            </div>
            <div>
              <div className="text-4xl font-serif font-black text-tab-cat">6</div>
              <div className="font-mono text-sm uppercase text-muted-foreground font-bold tracking-wider">Categorías</div>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-inedsor-blue/5 transition-colors">
            <div className="bg-inedsor-blue/10 p-4 rounded-none text-inedsor-blue transition-transform group-hover:scale-110">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <div className="text-4xl font-serif font-black text-inedsor-blue">3</div>
              <div className="font-mono text-sm uppercase text-muted-foreground font-bold tracking-wider">Participantes</div>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-tab-rank/5 transition-colors">
            <div className="bg-tab-rank/10 p-4 rounded-none text-tab-rank transition-transform group-hover:scale-110">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <div className="text-4xl font-serif font-black text-tab-rank">3</div>
              <div className="font-mono text-sm uppercase text-muted-foreground font-bold tracking-wider">Instituciones</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-20">
        
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b-4 border-tab-rank pb-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-black uppercase flex items-center gap-3 text-tab-rank">
                Top Instituciones <Trophy className="h-8 w-8 text-tab-rank" />
              </h2>
              <p className="font-mono text-muted-foreground mt-2 text-lg">Líderes de la competencia actual</p>
            </div>
            <Link href="/ranking" className="hidden sm:block">
              <Button variant="outline" className="rounded-none border-2 border-tab-rank text-tab-rank hover:bg-tab-rank hover:text-white font-bold uppercase transition-colors tracking-widest">VER RANKING COMPLETO</Button>
            </Link>
          </div>

          <div className="bg-card border-2 border-border shadow-[8px_8px_0px_0px_var(--color-tab-rank)] overflow-x-auto transition-shadow">
            <table className="table-layout w-full min-w-[920px]">
              <thead>
                <tr className="bg-tab-rank/10">
                  <th className="w-16 text-center text-tab-rank border-tab-rank/20">POS</th>
                  <th className="w-20 border-tab-rank/20">LOGO</th>
                  <th className="border-tab-rank/20 text-tab-rank">INSTITUCIÓN</th>
                  <th className="text-center w-24 border-tab-rank/20 text-tab-rank">ORO</th>
                  <th className="text-center w-24 border-tab-rank/20 text-tab-rank">PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                {topInstitutions.map((row, i) => (
                  <tr key={row.institutionId} className="group hover:bg-tab-rank/5 transition-colors border-b border-border last:border-b-0">
                    <td className="text-center font-serif text-2xl font-bold text-muted-foreground group-hover:text-tab-rank">{i + 1}</td>
                    <td className="p-2">
                      <InstitutionLogo 
                        institution={row.institution!} 
                        className="w-12 h-12 border-2 border-border bg-white group-hover:border-tab-rank transition-colors" 
                        fallbackClassName="text-sm"
                      />
                    </td>
                    <td className="font-bold">
                      <span className="uppercase text-lg group-hover:text-tab-rank transition-colors">{row.institution!.name}</span>
                      <div className="font-mono text-xs text-muted-foreground mt-1">Coach: {row.institution!.coach || 'N/A'}</div>
                    </td>
                    <td className="text-center font-mono text-xl text-amber-600 bg-amber-500/5">{row.gold}</td>
                    <td className="text-center font-mono font-black text-2xl bg-tab-rank/10 text-tab-rank">{row.points}</td>
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
             <Link href="/ranking" className="block">
              <Button variant="outline" className="w-full rounded-none border-2 border-tab-rank text-tab-rank font-bold tracking-widest">VER RANKING COMPLETO</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end border-b-4 border-tab-cat pb-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-black uppercase flex items-center gap-3 text-tab-cat">
                Próximos Encuentros <Layers className="h-8 w-8 text-tab-cat" />
              </h2>
              <p className="font-mono text-muted-foreground mt-2 text-lg">Programación oficial</p>
            </div>
            <Link href="/categorias" className="hidden sm:block">
              <Button variant="outline" className="rounded-none border-2 border-tab-cat text-tab-cat hover:bg-tab-cat hover:text-white font-bold uppercase transition-colors tracking-widest">VER TODAS LAS CATEGORÍAS</Button>
            </Link>
          </div>

          <div className="bg-card border-2 border-border shadow-[8px_8px_0px_0px_var(--color-tab-cat)] overflow-x-auto transition-shadow">
            <table className="table-layout w-full min-w-[600px]">
              <thead>
                <tr className="bg-tab-cat/10">
                  <th className="w-[22%] text-tab-cat border-tab-cat/20">CATEGORÍA</th>
                  <th className="w-[14%] text-tab-cat border-tab-cat/20">MODALIDAD</th>
                  <th className="w-[49%] text-tab-cat border-tab-cat/20">REGLAS BÁSICAS</th>
                  <th className="w-[15%] text-right text-tab-cat border-tab-cat/20">HORA INICIO</th>
                </tr>
              </thead>
              <tbody>
                {categories.slice(0, 5).map(cat => (
                  <tr key={cat.id} className="group hover:bg-tab-cat/5 transition-colors border-b border-border last:border-b-0">
                    <td className="font-bold">
                      <Link href={`/categorias/${cat.slug}`} className="hover:text-tab-cat hover:underline uppercase text-lg group-hover:text-tab-cat transition-colors">
                        {cat.name}
                      </Link>
                    </td>
                    <td className="font-mono uppercase text-xs">
                      <span className="px-2 py-1 bg-tab-cat/10 text-tab-cat font-bold rounded-none border border-tab-cat/20">{cat.format}</span>
                    </td>
                    <td className="text-muted-foreground text-sm whitespace-normal break-words leading-relaxed py-5 pr-8">
                      {cat.rules}
                    </td>
                    <td className="text-right font-mono font-black text-lg text-tab-cat">{cat.startTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden mt-4">
             <Link href="/categorias" className="block">
              <Button variant="outline" className="w-full rounded-none border-2 border-tab-cat text-tab-cat font-bold tracking-widest">VER TODAS LAS CATEGORÍAS</Button>
            </Link>
          </div>
        </div>

      </section>
    </div>
  )
}
