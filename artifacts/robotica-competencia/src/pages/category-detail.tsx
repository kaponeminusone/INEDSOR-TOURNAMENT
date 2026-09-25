import { useRoute, Link } from "wouter"
import { AlertTriangle, ChevronLeft, ChevronRight, Cpu, FileText, SearchX } from "lucide-react"
import { useData } from "@/lib/data"
import { categoryImages } from "@/lib/category-images"
import { modalityOf } from "@/lib/tournament"
import { regulationFor, REGULATION_PDF } from "@/lib/regulations"
import { Reveal } from "@/components/reveal"

function SpecTable({ title, rows }: { title: string; rows: { label: string; text: string }[] }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{title}</h3>
      <dl className="mt-3 border-t border-border">
        {rows.map(row => (
          <div key={row.label} className="grid gap-1 border-b border-border py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
            <dt className="text-[15px] font-semibold tracking-[-0.01em]">{row.label}</dt>
            <dd className="text-[15px] leading-relaxed text-foreground/80">{row.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function CategoryDetail() {
  const [, params] = useRoute("/categorias/:slug")
  const { categories, robots, participants, institutions } = useData()
  const category = categories.find(c => c.slug === params?.slug)

  if (!category) {
    return (
      <div className="container-apple flex min-h-[60dvh] flex-col items-center justify-center py-24 text-center">
        <SearchX size={40} className="text-muted-foreground" strokeWidth={1.5} />
        <h1 className="headline-md mt-5">Categoría no encontrada.</h1>
        <p className="mt-2 text-muted-foreground">Es posible que el enlace haya cambiado.</p>
        <Link href="/categorias" className="btn-pill btn-primary mt-8">Ver categorías</Link>
      </div>
    )
  }

  const reg = regulationFor(category.slug)
  const registered = robots.filter(r => r.categories.includes(category.id))
  const institutionOf = (participantId: string | null) => {
    const owner = participants.find(p => p.id === participantId)
    return institutions.find(i => i.id === owner?.institutionId)
  }
  const image = categoryImages[category.slug]
  const hasBracket = true

  return (
    <div className="pb-24">
      <section className="section-dark relative overflow-hidden">
        {image && <img src={image} alt={`Imagen ilustrativa de ${category.name}`} className="absolute inset-0 h-full w-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30" />
        <div className="container-apple relative flex min-h-[440px] flex-col justify-end pb-12 pt-10 md:min-h-[540px] md:pb-16">
          <Link href="/categorias" className="mb-auto inline-flex w-fit items-center gap-1 text-[14px] text-white/75 transition-colors hover:text-white">
            <ChevronLeft size={16} /> Categorías
          </Link>
          <span className="chip chip-dark w-fit">{reg ? `${reg.number} · ${reg.headerTag}` : modalityOf(category)}</span>
          <h1 className="headline-hero mt-4">{category.name}</h1>
          {reg && <p className="mt-4 max-w-2xl text-[19px] leading-relaxed text-white/80 md:text-[21px]">{reg.summary}</p>}
          <div className="mt-8 flex flex-wrap gap-4">
            {hasBracket && <Link href={`/bracket?category=${category.id}`} className="btn-pill btn-primary">Ver competencia</Link>}
            <a href={REGULATION_PDF} target="_blank" rel="noreferrer" className="btn-pill btn-ghost-dark">
              <FileText size={16} /> Reglamento{reg ? ` · pág. ${reg.page}` : ""}
            </a>
          </div>
          {image && <span className="absolute bottom-4 right-6 text-[11px] text-white/50">Imagen ilustrativa</span>}
        </div>
      </section>

      <section className="container-apple">
        <div className="grid grid-cols-2 border-b border-border md:grid-cols-4">
          {(reg?.highlights ?? [{ label: "Modalidad", value: modalityOf(category) }]).map(spec => (
            <div key={spec.label} className="py-8 pr-4">
              <div className="text-[26px] font-semibold leading-tight tracking-[-0.03em] md:text-[30px]">{spec.value}</div>
              <div className="mt-1 text-[14px] text-muted-foreground">{spec.label}</div>
            </div>
          ))}
        </div>

        {reg ? (
          <>
            <div className="grid gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-20">
              <Reveal>
                <h2 className="headline-md">Cómo se juega.</h2>
                <ul className="mt-6 space-y-4">
                  {reg.howToPlay.map(item => (
                    <li key={item} className="flex gap-3 text-[17px] leading-relaxed">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="tile tile-muted p-7 md:p-8">
                  <h2 className="flex items-center gap-2.5 text-[22px] font-semibold tracking-[-0.025em]">
                    <AlertTriangle size={20} className="text-brand-red" /> Faltas y sanciones
                  </h2>
                  <ul className="mt-5 space-y-3.5">
                    {reg.fouls.map(item => {
                      const [fault, sanction] = item.split(/:\s(?=[^:]*$)/)
                      return (
                        <li key={item} className="text-[15px] leading-relaxed">
                          {sanction ? <><span className="text-foreground/80">{fault}:</span> <span className="font-semibold">{sanction}</span></> : item}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Reveal>
            </div>

            <Reveal className="grid gap-12 border-t border-border pt-16 md:grid-cols-2 md:gap-16 md:pt-20">
              <SpecTable title="Robot" rows={reg.robot} />
              <SpecTable title={reg.field.title} rows={reg.field.items} />
            </Reveal>
          </>
        ) : (
          <p className="py-16 text-[17px] leading-relaxed">{category.rules}</p>
        )}

        <Reveal className="mt-20">
          <div className="flex items-baseline justify-between">
            <h2 className="headline-md">Inscritos.</h2>
            <span className="text-[15px] text-muted-foreground">{registered.length} {registered.length === 1 ? "robot" : "robots"}</span>
          </div>
          {registered.length === 0 ? (
            <div className="tile tile-muted mt-6 p-10 text-center text-muted-foreground">
              Aún no hay inscritos en esta categoría.
            </div>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {registered.map(robot => {
                const inst = institutionOf(robot.participantId)
                return (
                  <li key={robot.id} className="tile tile-muted flex items-center gap-4 p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-card text-primary">
                      <Cpu size={20} strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-semibold tracking-[-0.02em]">{robot.name}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">{inst?.name ?? "Sin institución asignada"}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {hasBracket && (
            <Link href={`/bracket?category=${category.id}`} className="link-chevron mt-6 text-[17px]">
              Seguir los encuentros <ChevronRight size={17} />
            </Link>
          )}
        </Reveal>
      </section>
    </div>
  )
}
