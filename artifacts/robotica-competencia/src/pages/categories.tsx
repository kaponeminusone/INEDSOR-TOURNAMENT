import { Link } from "wouter"
import { useData } from "@/lib/data"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Clock, Sword } from "lucide-react"

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
      <div className="mb-12 border-b-4 border-foreground pb-8">
        <h1 className="text-5xl md:text-7xl font-serif font-black uppercase mb-4">Categorías</h1>
        <p className="text-xl font-mono text-muted-foreground max-w-2xl">
          Explora las reglas, formatos y participantes de cada competencia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="flex flex-col group hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all">
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-muted/50">{getFormatLabel(category.format)}</Badge>
                <div className="font-mono text-sm font-bold flex items-center gap-1 bg-foreground text-background px-2 py-1">
                  <Clock className="h-3 w-3" /> {category.startTime}
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 mt-4">
              <p className="font-mono text-sm mb-6 line-clamp-3">
                {category.rules}
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-foreground/10">
                <div>
                  <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Inscritos</div>
                  <div className="font-bold flex items-center gap-2">
                    <Sword className="h-4 w-4" /> {getRobotsCount(category.id)} Robots
                  </div>
                </div>
                <div>
                  <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Equipos</div>
                  <div className="font-bold flex items-center gap-2">
                    <Users className="h-4 w-4" /> {category.teamSize} pax
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto">
              <Link href={`/categorias/${category.slug}`} className="w-full">
                <Button className="w-full group-hover:bg-foreground group-hover:text-background transition-colors">
                  VER DETALLES Y LLAVES <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
