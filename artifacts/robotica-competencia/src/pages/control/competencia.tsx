import { useState } from "react"
import { useData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Trophy, AlertCircle, Award, Medal } from "lucide-react"

export default function ControlCompetencia() {
  const { categories, matches, robots, institutions, updateMatch, registerPodium } = useData()
  const [selectedCat, setSelectedCat] = useState<string>(categories[0]?.id || "")

  const activeCategory = categories.find(c => c.id === selectedCat)
  const catMatches = matches.filter(m => m.categoryId === selectedCat)

  const [podiumOpen, setPodiumOpen] = useState(false)
  const [podiumForm, setPodiumForm] = useState({ gold: '', silver: '', bronze: '' })

  const getRobotNames = (ids: string[]) => {
    if (ids.length === 0) return <span className="text-muted-foreground">TBD</span>
    return ids.map(id => robots.find(r => r.id === id)?.name || "Desconocido").join(' + ')
  }

  const handleStatusChange = (matchId: string, status: 'pending' | 'active' | 'completed') => {
    updateMatch(matchId, { status })
  }

  const handleWinner = (matchId: string, winner: 'A' | 'B') => {
    updateMatch(matchId, { winner, status: 'completed' })
  }

  const handlePodiumSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCategory) return
    registerPodium(activeCategory.id, podiumForm.gold, podiumForm.silver, podiumForm.bronze)
    setPodiumOpen(false)
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-black uppercase mb-2">Pista / Competencia</h1>
        <p className="font-mono text-muted-foreground">Gestión de encuentros y resultados en tiempo real.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 mb-8 border-b-2 border-foreground">
        {categories.map(c => (
          <Button
            key={c.id}
            variant={selectedCat === c.id ? "default" : "outline"}
            onClick={() => setSelectedCat(c.id)}
            className="shrink-0"
          >
            {c.name}
          </Button>
        ))}
      </div>

      {activeCategory?.format === 'podio' ? (
        <div className="border-4 border-foreground p-12 text-center bg-card">
          <Trophy className="h-16 w-16 mx-auto mb-6 text-foreground" />
          <h2 className="text-3xl font-serif font-bold uppercase mb-4">Evaluación Directa</h2>
          <p className="font-mono text-muted-foreground mb-8 max-w-xl mx-auto">
            Esta categoría no utiliza llaves de eliminación. Asigna los lugares del podio directamente basados en la evaluación del jurado.
          </p>
          
          <Dialog open={podiumOpen} onOpenChange={setPodiumOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg px-12">REGISTRAR PODIO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Podio - {activeCategory.name}</DialogTitle></DialogHeader>
              <form onSubmit={handlePodiumSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> ORO (1er Lugar)</Label>
                  <select required className="flex h-12 w-full border-2 border-foreground bg-amber-500/10 px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={podiumForm.gold} onChange={e=>setPodiumForm({...podiumForm, gold: e.target.value})}>
                    <option value="" disabled>Seleccionar institución...</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Medal className="h-4 w-4 text-slate-400" /> PLATA (2do Lugar)</Label>
                  <select required className="flex h-12 w-full border-2 border-foreground bg-slate-300/10 px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={podiumForm.silver} onChange={e=>setPodiumForm({...podiumForm, silver: e.target.value})}>
                    <option value="" disabled>Seleccionar institución...</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Award className="h-4 w-4 text-orange-500" /> BRONCE (3er Lugar)</Label>
                  <select required className="flex h-12 w-full border-2 border-foreground bg-orange-500/10 px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={podiumForm.bronze} onChange={e=>setPodiumForm({...podiumForm, bronze: e.target.value})}>
                    <option value="" disabled>Seleccionar institución...</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={()=>setPodiumOpen(false)}>CANCELAR</Button>
                  <Button type="submit">GUARDAR PODIO Y PUNTOS</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold uppercase flex items-center gap-3">
            Encuentros {activeCategory?.name}
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {catMatches.map(match => (
              <div key={match.id} className="border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col">
                <div className="p-4 border-b-2 border-foreground bg-muted flex justify-between items-center">
                  <div className="font-mono font-bold uppercase">{match.label}</div>
                  <Badge 
                    variant={match.status === 'completed' ? 'default' : match.status === 'active' ? 'secondary' : 'outline'}
                    className={match.status === 'active' ? 'bg-amber-400 text-black border-transparent animate-pulse' : ''}
                  >
                    {match.status}
                  </Badge>
                </div>
                
                <div className="flex-1 flex flex-col">
                  {/* For groups, just list side A as participants */}
                  {activeCategory?.format === 'grupo' ? (
                    <div className="p-4 flex-1">
                      <div className="font-mono text-xs text-muted-foreground uppercase mb-2">Competidores en Pista:</div>
                      <div className="font-bold text-lg leading-relaxed">
                        {getRobotNames(match.sideARobots)}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 border-b-2 border-foreground flex justify-between items-center transition-colors flex-1 ${match.winner === 'A' ? 'bg-primary text-primary-foreground' : ''}`}>
                        <div className="font-bold text-lg uppercase flex-1 pr-4 leading-tight">
                          {getRobotNames(match.sideARobots)}
                        </div>
                        {match.status === 'active' && match.sideARobots.length > 0 && (
                          <Button size="sm" variant={match.winner === 'A' ? 'secondary' : 'outline'} onClick={() => handleWinner(match.id, 'A')} className="shrink-0">
                            GANA A
                          </Button>
                        )}
                      </div>
                      
                      <div className={`p-4 flex justify-between items-center transition-colors flex-1 ${match.winner === 'B' ? 'bg-primary text-primary-foreground' : ''}`}>
                        <div className="font-bold text-lg uppercase flex-1 pr-4 leading-tight">
                          {getRobotNames(match.sideBRobots)}
                        </div>
                        {match.status === 'active' && match.sideBRobots.length > 0 && (
                          <Button size="sm" variant={match.winner === 'B' ? 'secondary' : 'outline'} onClick={() => handleWinner(match.id, 'B')} className="shrink-0">
                            GANA B
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 border-t-2 border-foreground bg-muted/50 flex gap-2 justify-end mt-auto">
                  {match.status === 'pending' && (
                    <Button size="sm" onClick={() => handleStatusChange(match.id, 'active')}>
                      LLAMAR A PISTA (INICIAR)
                    </Button>
                  )}
                  {match.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(match.id, 'pending')}>
                      PAUSAR / CANCELAR
                    </Button>
                  )}
                  {match.status === 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => updateMatch(match.id, { winner: undefined, status: 'active' })}>
                      REVERTIR RESULTADO
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {catMatches.length === 0 && (
              <div className="col-span-full border-4 border-dashed border-foreground/30 p-12 text-center text-muted-foreground font-mono">
                <AlertCircle className="h-8 w-8 mx-auto mb-4" />
                No hay encuentros generados para esta categoría.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
