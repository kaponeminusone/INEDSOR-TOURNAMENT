import { Link } from "wouter"
import { ChevronRight, FileText } from "lucide-react"
import { useData } from "@/lib/data"
import { DAY_PLAN, EVENT, GENERAL_RULES, ORGANIZATION, REGULATION_PDF, regulationFor } from "@/lib/regulations"
import { PageHeader } from "@/components/page-header"
import { Reveal } from "@/components/reveal"

export default function Regulations() {
  const { categories } = useData()

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Reglamento oficial"
        title="Reglas del torneo."
        description={`Aplican a todas las categorías. Documento emitido el ${EVENT.issued} para el evento del ${EVENT.dateLabel}.`}
        actions={
          <a href={REGULATION_PDF} target="_blank" rel="noreferrer" className="btn-pill btn-primary">
            <FileText size={16} /> Descargar PDF
          </a>
        }
      />

      <div className="container-apple">
        <Reveal className="tile tile-muted p-6 md:p-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Así será el día</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-5">
            {DAY_PLAN.map((step, i) => (
              <li key={step}>
                <span className="text-[24px] font-semibold tracking-[-0.03em] text-primary">{i + 1}</span>
                <p className="mt-1 text-[15px] leading-snug">{step}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-16 divide-y divide-border border-y border-border">
          {GENERAL_RULES.map(section => (
            <Reveal key={section.title} className="grid gap-4 py-8 md:grid-cols-[240px_1fr] md:gap-10">
              <h2 className="text-[21px] font-semibold tracking-[-0.025em]">{section.title}</h2>
              <ul className="space-y-3">
                {section.items.map(item => (
                  <li key={item} className="flex gap-3 text-[17px] leading-relaxed">
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20">
          <h2 className="headline-md">Reglas por categoría.</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => {
              const reg = regulationFor(category.slug)
              return (
                <li key={category.id}>
                  <Link href={`/categorias/${category.slug}`} className="tile tile-muted group flex items-center gap-4 p-5 transition-colors hover:bg-[hsl(240_6%_93%)]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-[15px] font-semibold">{reg?.number ?? "·"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold tracking-[-0.015em]">{category.name}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">{reg ? `${reg.kind} · ${reg.modality}` : category.rules}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Reveal>

        <Reveal className="mt-20">
          <h2 className="headline-md">Organización y atención.</h2>
          <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {ORGANIZATION.map(item => (
              <div key={item.role} className="border-t border-border pt-4">
                <dt className="font-semibold tracking-[-0.015em]">{item.role}</dt>
                <dd className="mt-1 text-[15px] text-muted-foreground">{item.text}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </div>
  )
}
