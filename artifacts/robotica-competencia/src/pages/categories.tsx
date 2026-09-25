import { Link } from "wouter"
import { ChevronRight, Cpu, Timer } from "lucide-react"
import { useData } from "@/lib/data"
import { categoryImages } from "@/lib/category-images"
import { kindOf, modalityOf } from "@/lib/tournament"
import { regulationFor } from "@/lib/regulations"
import { PageHeader } from "@/components/page-header"
import { Reveal } from "@/components/reveal"

export default function Categories() {
  const { categories, robots } = useData()
  const robotsIn = (categoryId: string) => robots.filter(r => r.categories.includes(categoryId)).length

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Categorías"
        title="Elige tu pista."
        description="Nueve categorías entre robots autónomos, radiocontrol y dron. Reglas, medidas y robots inscritos de cada una."
      />

      <div className="container-apple grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, i) => (
          <Reveal key={category.id} delay={(i % 3) * 0.08}>
            <Link
              href={`/categorias/${category.slug}`}
              className="tile tile-muted tile-interactive group flex h-full flex-col"
            >
              <div className="tile-media relative aspect-[4/3] bg-black">
                {categoryImages[category.slug] && (
                  <img src={categoryImages[category.slug]} alt={`Imagen ilustrativa de ${category.name}`} loading="lazy" decoding="async" />
                )}
                <span className="chip chip-dark absolute left-4 top-4">{kindOf(category) ?? "Categoría"}</span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">{category.name}</h2>
                <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">{regulationFor(category.slug)?.summary ?? category.rules}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-[13px] text-foreground/70">
                  <span className="inline-flex items-center gap-1.5"><Timer size={14} /> {modalityOf(category)}</span>
                  <span className="inline-flex items-center gap-1.5"><Cpu size={14} /> {robotsIn(category.id)} inscritos</span>
                </div>
                <span className="link-chevron mt-5 text-[15px]">
                  Ver categoría <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
      <p className="container-apple mt-6 text-[12px] text-muted-foreground">Las imágenes son ilustrativas.</p>
    </div>
  )
}
