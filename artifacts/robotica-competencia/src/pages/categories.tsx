import { Link } from "wouter"
import { useData } from "@/lib/data"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, Clock, Sword, Layers } from "lucide-react"
import { categoryImages } from "@/lib/category-images"

export default function Categories() {
  const { categories, robots } = useData()

  const getFormatLabel = (format: string) => {
    switch(format) {
      case 'duelo': return '1 vs 1';
      case '2v2': return '2 vs 2';
      case 'grupo': return 'Carrera/Grupo';
      case 'podio': return 'Evaluación Directa';
      default: return format;
    }
  }

  const getRobotsCount = (categoryId: string) => {
    return robots.filter(r => r.categories.includes(categoryId)).length;
  }

  return (
    <div className="categories-page page-shell">
      <div className="mb-10 border-b-2 border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-tab-cat/10 text-tab-cat border border-tab-cat/20">
              <Layers className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-black uppercase text-tab-cat tracking-tight">Categorías</h1>
          </div>
          <p className="text-lg font-mono text-muted-foreground max-w-2xl">
            Explora las reglas, formatos y participantes de cada competencia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="flex flex-col rounded-none border-2 border-border hover:border-tab-cat/50 group transition-colors duration-200 bg-card">
            {categoryImages[category.slug] && (
              <figure className="category-card-photo">
                <img src={categoryImages[category.slug]} alt={`Imagen ilustrativa de ${category.name}`} loading="lazy" decoding="async" />
                <figcaption>Imagen ilustrativa</figcaption>
              </figure>
            )}
            <CardHeader className="border-b-2 border-border pb-4 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-muted text-foreground border-border rounded-none uppercase font-mono font-bold tracking-wider">{getFormatLabel(category.format)}</Badge>
                <div className="font-mono text-xs font-bold flex items-center gap-1 bg-tab-cat/10 text-tab-cat border border-tab-cat/20 px-2 py-1">
                  <Clock className="h-3 w-3" /> {category.startTime}
                </div>
              </div>
              <CardTitle className="text-2xl uppercase font-serif tracking-tight leading-tight group-hover:text-tab-cat transition-colors">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 mt-4">
              <p className="font-mono text-sm mb-6 text-muted-foreground">
                {category.rules}
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-border/50">
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-widest">Inscritos</div>
                  <div className="font-bold flex items-center gap-2 text-base text-foreground">
                    <Sword className="h-4 w-4 text-tab-cat" /> {getRobotsCount(category.id)} Robots
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground font-bold uppercase mb-1 tracking-widest">Equipos</div>
                  <div className="font-bold flex items-center gap-2 text-base text-foreground">
                    <Users className="h-4 w-4 text-tab-cat" /> {category.teamSize} pax
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto pt-0 pb-6 px-6">
              <Link href={`/categorias/${category.slug}`} className="inline-link">Explorar categoría <ArrowRight size={15} /></Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
