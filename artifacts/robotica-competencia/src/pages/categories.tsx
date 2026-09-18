import { Link } from "wouter"
import { useData } from "@/lib/data"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Clock, Sword, Layers } from "lucide-react"

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
    <div className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 border-b-4 border-tab-cat pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-tab-cat text-background">
              <Layers className="h-10 w-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black uppercase text-tab-cat tracking-tight">Categorías</h1>
          </div>
          <p className="text-xl font-mono text-muted-foreground max-w-2xl">
            Explora las reglas, formatos y participantes de cada competencia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <Card key={category.id} className="flex flex-col rounded-none border-2 border-border hover:border-tab-cat group hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_var(--color-tab-cat)] transition-all duration-300 bg-card">
            <CardHeader className="border-b-2 border-border group-hover:border-tab-cat/30 pb-4 transition-colors bg-muted/10 group-hover:bg-tab-cat/5">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-tab-cat/10 text-tab-cat border-tab-cat/20 rounded-none uppercase font-mono font-bold tracking-wider">{getFormatLabel(category.format)}</Badge>
                <div className="font-mono text-xs font-bold flex items-center gap-1 bg-tab-cat text-white px-2 py-1">
                  <Clock className="h-3 w-3" /> {category.startTime}
                </div>
              </div>
              <CardTitle className="text-3xl uppercase font-serif tracking-tight group-hover:text-tab-cat transition-colors leading-tight">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 mt-4">
              <p className="font-mono text-sm mb-6 line-clamp-3 text-muted-foreground">
                {category.rules}
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-border/50 group-hover:border-tab-cat/20 transition-colors">
                <div>
                  <div className="font-mono text-[10px] text-tab-cat font-bold uppercase mb-1 tracking-widest">Inscritos</div>
                  <div className="font-bold flex items-center gap-2 text-lg text-foreground">
                    <Sword className="h-4 w-4 text-tab-cat/70" /> {getRobotsCount(category.id)} Robots
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] text-tab-cat font-bold uppercase mb-1 tracking-widest">Equipos</div>
                  <div className="font-bold flex items-center gap-2 text-lg text-foreground">
                    <Users className="h-4 w-4 text-tab-cat/70" /> {category.teamSize} pax
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto pt-0 pb-6 px-6">
              <Link href={`/categorias/${category.slug}`} className="w-full block">
                <Button className="w-full rounded-none bg-foreground text-background group-hover:bg-tab-cat group-hover:text-white transition-colors font-bold uppercase text-sm h-12 tracking-widest">
                  VER DETALLES <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
