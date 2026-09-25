import { useRoute, Link } from "wouter"
import { useData } from "@/lib/data"
import { ArrowLeft, User, ShieldAlert } from "lucide-react"
import { categoryImages } from "@/lib/category-images"

export default function CategoryDetail() {
  const [, params] = useRoute("/categorias/:slug")
  const { categories, robots, institutions } = useData()
  
  const category = categories.find(c => c.slug === params?.slug)

  if (!category) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <ShieldAlert className="h-16 w-16 mb-4 text-muted-foreground" />
        <h1 className="text-3xl font-serif uppercase font-bold mb-4">Categoría no encontrada</h1>
        <Link href="/categorias" className="soft-button primary">Volver a categorías</Link>
      </div>
    )
  }

  // Get robots registered in this category
  const registeredRobots = robots.filter(r => r.categories.includes(category.id))

  return (
    <div className="category-detail-page page-shell">
      <Link href="/categorias" className="inline-flex items-center font-mono text-sm font-bold uppercase hover:underline mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> VOLVER
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h1 className="text-5xl md:text-7xl font-serif font-black uppercase mb-6 leading-none">
            {category.name}
          </h1>
          {categoryImages[category.slug] && (
            <figure className="category-detail-photo">
              <img src={categoryImages[category.slug]} alt={`Imagen ilustrativa de ${category.name}`} decoding="async" />
              <figcaption>Imagen ilustrativa de la categoría</figcaption>
            </figure>
          )}
          
          <div className="flex flex-wrap gap-4 mb-8 font-mono text-sm">
            <div className="border-2 border-foreground px-4 py-2 bg-muted">
              FORMATO: <strong className="uppercase">{category.format}</strong>
            </div>
            <div className="border-2 border-foreground px-4 py-2 bg-muted">
              INICIO: <strong>{category.startTime}</strong>
            </div>
            <div className="border-2 border-foreground px-4 py-2 bg-muted">
              TAMAÑO EQUIPO: <strong>{category.teamSize} PAX</strong>
            </div>
          </div>

          <div className="border-t-4 border-foreground pt-8 mb-12">
            <h2 className="text-3xl font-serif font-bold uppercase mb-4">Reglamento y Formato</h2>
            <div className="prose prose-p:font-mono prose-p:text-muted-foreground max-w-none">
              <p className="text-lg">{category.rules}</p>
              <p className="mt-4">
                Todos los robots deben ser homologados antes del inicio de la competencia. 
                Los participantes que no se presenten al llamado en 3 minutos serán descalificados por Walkover (W.O.).
              </p>
            </div>
          </div>

          <div className="border-t-4 border-foreground pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-serif font-bold uppercase">Robots Inscritos</h2>
              <span className="font-mono text-2xl font-bold bg-foreground text-background px-4 py-1">
                {registeredRobots.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {registeredRobots.map(robot => (
                <div key={robot.id} className="border-2 border-foreground p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="h-12 w-12 bg-muted border-2 border-foreground flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold uppercase text-lg">{robot.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">ID: {robot.id.toUpperCase()}</div>
                  </div>
                </div>
              ))}
              
              {registeredRobots.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-foreground/30 p-8 text-center font-mono text-muted-foreground">
                  No hay robots inscritos en esta categoría.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 border-4 border-foreground bg-card p-6">
            <h3 className="text-2xl font-serif font-bold uppercase mb-4 border-b-2 border-foreground pb-4">
              Acciones
            </h3>
            <div className="flex flex-col gap-4">
              <Link href={`/bracket?category=${category.id}`} className="soft-button primary w-full">Ver llaves</Link>
              <Link href={`/control/competencia?category=${category.id}`} className="soft-button w-full">Gestionar encuentros</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
