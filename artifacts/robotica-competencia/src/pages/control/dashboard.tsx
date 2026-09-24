import { useData } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "wouter"
import { Activity, Users, CheckCircle2, ShieldAlert } from "lucide-react"

export default function ControlDashboard() {
  const { categories, participants, matches, robots } = useData()

  const pendingMatches = matches.filter(m => m.status === 'pending').length
  const activeMatches = matches.filter(m => m.status === 'active').length
  const completedMatches = matches.filter(m => m.status === 'completed').length
  
  const attendedCount = participants.filter(p => p.attendedAt).length
  const attendanceRate = participants.length > 0 ? Math.round((attendedCount / participants.length) * 100) : 0

  return (
    <div className="p-6 md:p-10 w-full max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-black uppercase mb-2">Panel de Control</h1>
        <p className="font-mono text-muted-foreground">Resumen operativo del evento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="bg-foreground text-background">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="font-mono text-sm uppercase opacity-80">Encuentros Activos</div>
              <Activity className="h-5 w-5 animate-pulse text-amber-400" />
            </div>
            <div className="text-5xl font-black font-serif">{activeMatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="font-mono text-sm uppercase text-muted-foreground">Progreso Partidas</div>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-5xl font-black font-serif">{completedMatches}<span className="text-2xl text-muted-foreground">/{matches.length}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="font-mono text-sm uppercase text-muted-foreground">Asistencia</div>
              <Users className="h-5 w-5" />
            </div>
            <div className="text-5xl font-black font-serif">{attendanceRate}%</div>
            <div className="font-mono text-xs mt-2 text-muted-foreground">{attendedCount} de {participants.length} confirmados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="font-mono text-sm uppercase text-muted-foreground">Robots Homologados</div>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="text-5xl font-black font-serif">{robots.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-serif font-bold uppercase mb-6 border-b-2 border-foreground pb-2">Estado por Categoría</h2>
          <div className="space-y-4">
            {categories.map(cat => {
              const catMatches = matches.filter(m => m.categoryId === cat.id)
              const completed = catMatches.filter(m => m.status === 'completed').length
              const total = catMatches.length
              const progress = total > 0 ? (completed / total) * 100 : 0
              
              return (
                <div key={cat.id} className="border-2 border-foreground p-4 bg-card">
                  <div className="flex justify-between font-bold uppercase mb-2">
                    <span>{cat.name}</span>
                    <span className="font-mono">{completed}/{total}</span>
                  </div>
                  <div className="h-4 bg-muted border-2 border-foreground w-full overflow-hidden">
                    <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold uppercase mb-6 border-b-2 border-foreground pb-2">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/control/asistencia" className="group">
              <Card className="h-full group-hover:bg-foreground group-hover:text-background transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Registro de Asistencia</CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-sm opacity-80">
                  Marcar llegada de delegaciones y validar inscripción.
                </CardContent>
              </Card>
            </Link>
            <Link href="/control/competencia" className="group">
              <Card className="h-full group-hover:bg-foreground group-hover:text-background transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Llamado a Pista</CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-sm opacity-80">
                  Iniciar encuentros y registrar resultados.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
