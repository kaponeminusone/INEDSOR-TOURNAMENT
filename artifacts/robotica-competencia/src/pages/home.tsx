import { useEffect, useRef, useState } from "react"
import { Link } from "wouter"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { ChevronLeft, ChevronRight, FileText, Trophy } from "lucide-react"
import { useData } from "@/lib/data"
import { categoryImages } from "@/lib/category-images"
import { buildLeaderboard, kindOf, modalityOf } from "@/lib/tournament"
import { DAY_PLAN, ESSENTIALS, EVENT, REGULATION_PDF } from "@/lib/regulations"
import { InstitutionLogo } from "@/components/institution-logo"
import { Reveal } from "@/components/reveal"
import heroImage from "@assets/generated_images/inedsor-sumo.jpg"

function RollingDigit({ digit }: { digit: string }) {
  const num = Number(digit)
  return (
    <span className="rolling-digit" aria-hidden="true">
      <span style={{ transform: `translateY(-${num}em)` }}>
        {Array.from({ length: 10 }, (_, d) => <span key={d}>{d}</span>)}
      </span>
    </span>
  )
}

function RollingNumber({ value, pad = 2 }: { value: number; pad?: number }) {
  const text = value.toString().padStart(pad, "0")
  return (
    <span className="tabular inline-flex">
      <span className="sr-only">{text}</span>
      {text.split("").map((c, i) => <RollingDigit key={i} digit={c} />)}
    </span>
  )
}

function useCountdown(target: Date) {
  const compute = () => {
    const diff = Math.max(0, target.getTime() - Date.now())
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    }
  }
  const [time, setTime] = useState(compute)
  useEffect(() => {
    const timer = setInterval(() => setTime(compute()), 1000)
    return () => clearInterval(timer)
  }, [])
  return time
}

const eventDateRaw = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }).format(EVENT.date)
const eventDate = eventDateRaw.charAt(0).toUpperCase() + eventDateRaw.slice(1)
const EVENT_END = EVENT.date.getTime() + 86_400_000

export default function Home() {
  const { categories, institutions, rankings, participants, robots } = useData()
  const time = useCountdown(EVENT.date)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])
  const phase = now < EVENT.date.getTime() ? "before" : now < EVENT_END ? "today" : "after"
  const reduce = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12])
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"])

  const leaders = buildLeaderboard(rankings, institutions).slice(0, 3)

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 700), behavior: "smooth" })
  }

  const stats = [
    { value: categories.length, label: "categorías de competencia" },
    { value: participants.length, label: "participantes inscritos" },
    { value: robots.length, label: "robots en pista" },
    { value: institutions.length, label: "instituciones" },
  ]

  return (
    <div>
      {/* Hero */}
      <section ref={heroRef} className="section-dark relative overflow-hidden">
        <div className="hero-glow" />
        <div className="container-apple relative pt-16 text-center md:pt-24">
          <div>
            <span className="chip chip-dark mb-6">{EVENT.institution}</span>
            <h1 className="headline-hero">Torneo INEDSOR.</h1>
            <p className="headline-md mt-3 text-gradient font-semibold">Ingenio. Estrategia. Robótica.</p>
            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-[#a1a1a6] md:text-[19px]">
              Competencia de robótica y dron: estudiantes ponen a prueba sus robots en {categories.length} categorías.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/categorias" className="btn-pill btn-primary">Explorar categorías</Link>
              <Link href="/ranking" className="btn-pill btn-ghost-dark">Ver clasificación</Link>
            </div>
          </div>
        </div>

        <div className="container-wide relative mt-14 md:mt-20">
          <div className="relative mx-auto aspect-[4/5] max-h-[620px] w-full overflow-hidden rounded-t-[24px] sm:aspect-[16/9] md:aspect-[21/9] md:rounded-t-[32px]">
            <motion.img
              src={heroImage}
              alt="Robots de sumo enfrentándose en el dohyo"
              className="h-full w-full object-cover"
              style={{ scale: imageScale, y: imageY }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              {phase === "before" ? (
                <>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/60">Faltan para el torneo</p>
              <div className="mt-3 flex items-end gap-5 text-white md:gap-9" role="timer" aria-live="off">
                {[
                  { v: time.days, l: "días", pad: 3 },
                  { v: time.hours, l: "horas" },
                  { v: time.minutes, l: "min" },
                  { v: time.seconds, l: "seg" },
                ].map(unit => (
                  <div key={unit.l} className="flex flex-col">
                    <span className="text-[36px] font-semibold leading-none tracking-[-0.04em] md:text-[64px]">
                      <RollingNumber value={unit.v} pad={unit.pad} />
                    </span>
                    <span className="mt-2 text-[12px] font-medium text-white/60 md:text-[13px]">{unit.l}</span>
                  </div>
                ))}
              </div>
                </>
              ) : (
                <p className="text-[36px] font-semibold leading-none tracking-[-0.04em] text-white md:text-[64px]">
                  {phase === "today" ? "Hoy es el torneo." : "Gracias por participar."}
                </p>
              )}
              <p className="mt-4 text-[14px] text-white/70">{eventDate}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="container-apple">
          <Reveal>
            <h2 className="headline-lg max-w-2xl">El torneo en cifras.</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <div className="border-t border-border pt-5">
                  <div className="text-[48px] font-semibold leading-none tracking-[-0.045em] md:text-[64px]">{stat.value}</div>
                  <p className="mt-2 text-[15px] text-muted-foreground">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories carousel */}
      <section className="section section-muted overflow-hidden">
        <div className="container-apple flex items-end justify-between gap-6">
          <Reveal>
            <h2 className="headline-lg">Conoce las categorías.</h2>
          </Reveal>
          <Link href="/categorias" className="link-chevron hidden shrink-0 text-[17px] sm:inline-flex">
            Ver todas <ChevronRight size={17} />
          </Link>
        </div>

        <Reveal y={40}>
          <div ref={scrollerRef} className="scroller mt-10">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="tile tile-interactive tile-media relative block h-[460px] w-[min(78vw,340px)] bg-black text-white"
              >
                {categoryImages[cat.slug] && (
                  <img src={categoryImages[cat.slug]} alt="" loading="lazy" className="absolute inset-0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/60" />
                <div className="relative flex h-full flex-col justify-between p-7">
                  <div>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/70">{kindOf(cat) ?? "Categoría"}</span>
                    <h3 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em]">{cat.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-white/80">{modalityOf(cat)}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur-md">
                      <ChevronRight size={18} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        <div className="container-apple flex justify-end gap-3">
          <button onClick={() => scrollBy(-1)} aria-label="Categorías anteriores" className="grid h-9 w-9 place-items-center rounded-full bg-black/[.08] text-foreground/70 transition-colors hover:bg-black/[.14]">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => scrollBy(1)} aria-label="Más categorías" className="grid h-9 w-9 place-items-center rounded-full bg-black/[.08] text-foreground/70 transition-colors hover:bg-black/[.14]">
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Leaders */}
      <section className="section">
        <div className="container-apple">
          <div className="flex items-end justify-between gap-6">
            <Reveal>
              <span className="eyebrow mb-3">Clasificación</span>
              <h2 className="headline-lg">Quién lidera.</h2>
            </Reveal>
            <Link href="/ranking" className="link-chevron hidden shrink-0 text-[17px] sm:inline-flex">
              Ranking completo <ChevronRight size={17} />
            </Link>
          </div>

          {leaders.length === 0 ? (
            <p className="mt-10 text-muted-foreground">Aún no hay puntos registrados en esta edición.</p>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {leaders.map((row, i) => (
                <Reveal key={row.institutionId} delay={i * 0.1}>
                  <div className={`tile tile-muted flex h-full flex-col p-8 ${i === 0 ? "md:-translate-y-0" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[56px] font-semibold leading-none tracking-[-0.05em] text-foreground/15">{i + 1}</span>
                      <Trophy size={22} className={i === 0 ? "text-gold" : i === 1 ? "text-silver" : "text-bronze"} />
                    </div>
                    <InstitutionLogo institution={row.institution} className="mt-8 h-14 w-14 rounded-2xl bg-card text-[15px]" />
                    <h3 className="mt-5 text-[21px] font-semibold leading-tight tracking-[-0.02em]">{row.institution.name}</h3>
                    <p className="mt-1 text-[14px] text-muted-foreground">Coach: {row.institution.coach || "Sin asignar"}</p>
                    <div className="mt-auto flex items-baseline gap-2 pt-8">
                      <span className="text-[40px] font-semibold leading-none tracking-[-0.04em]">{row.points}</span>
                      <span className="text-[14px] text-muted-foreground">puntos</span>
                    </div>
                    <div className="mt-4 flex gap-4 text-[13px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" />{row.gold} oro</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-silver" />{row.silver} plata</span>
                      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-bronze" />{row.bronze} bronce</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
          <Link href="/ranking" className="link-chevron mt-8 text-[17px] sm:hidden">
            Ranking completo <ChevronRight size={17} />
          </Link>
        </div>
      </section>

      {/* Day plan */}
      <section className="section section-muted">
        <div className="container-apple">
          <Reveal>
            <span className="eyebrow mb-3">{EVENT.dateLabel}</span>
            <h2 className="headline-lg">Así será el día.</h2>
          </Reveal>
          <ol className="mt-10 grid gap-3 md:grid-cols-5">
            {DAY_PLAN.map((step, i) => (
              <Reveal as="li" key={step} delay={i * 0.06} className="tile flex flex-col p-6">
                <span className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-primary">{i + 1}</span>
                <span className="mt-6 text-[16px] font-medium leading-snug tracking-[-0.015em]">{step}</span>
              </Reveal>
            ))}
          </ol>
          <p className="mt-5 text-[14px] text-muted-foreground">
            El reglamento no fija horarios por categoría. Los brackets y las categorías en paralelo se anuncian después de la bienvenida.
          </p>

          <div className="mt-16 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {ESSENTIALS.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 0.08} className="border-t border-border pt-5">
                <h3 className="text-[19px] font-semibold tracking-[-0.02em]">{item.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{item.text}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-5">
            <Link href="/reglamento" className="link-chevron text-[17px]">Reglas generales <ChevronRight size={17} /></Link>
            <a href={REGULATION_PDF} target="_blank" rel="noreferrer" className="link-chevron text-[17px]"><FileText size={16} className="mr-1" /> Reglamento oficial (PDF)</a>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-dark relative overflow-hidden">
        <div className="hero-glow opacity-70" />
        <Reveal className="container-apple relative py-24 text-center md:py-32">
          <h2 className="headline-xl">Que empiece la competencia.</h2>
          <p className="lead mx-auto mt-4 max-w-xl">Sigue las llaves en vivo y descubre quién avanza en cada ronda.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/bracket" className="btn-pill btn-light">Ver llaves</Link>
            <Link href="/galeria" className="btn-pill btn-ghost-dark">Galería del evento</Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
