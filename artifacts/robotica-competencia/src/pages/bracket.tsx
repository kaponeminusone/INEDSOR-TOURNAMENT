import { useState, useRef, useEffect } from "react"
import { useData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize, MousePointer2 } from "lucide-react"

export default function Bracket() {
  const { categories, matches, robots } = useData()
  const [selectedCat, setSelectedCat] = useState<string>(matches[0]?.categoryId || categories[0]?.id || "")
  
  // Try to read category from URL if exists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get('category')
    if (cat && categories.find(c => c.id === cat)) {
      setSelectedCat(cat)
    }
  }, [categories])

  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const panState = useRef({ active: false, x: 0, y: 0, left: 0, top: 0 })

  const activeCategory = categories.find(c => c.id === selectedCat)
  
  // Filter matches for current category
  const catMatches = matches.filter(m => m.categoryId === selectedCat)
  
  // Very simplistic hardcoded bracket layout based on the mock data round structure
  // In a real app, this would use a tree traversal to layout nodes
  const rounds = [1, 2, 3] // mock rounds

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 2))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))
  const handleResetZoom = () => setScale(1)

  const getRobotName = (id: string) => robots.find(r => r.id === id)?.name || "---"
  const getTeamName = (ids: string[]) => ids.length ? ids.map(getRobotName).join(" + ") : "---"

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container || event.button !== 0) return
    panState.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      left: container.scrollLeft,
      top: container.scrollTop,
    }
    container.setPointerCapture(event.pointerId)
  }

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container || !panState.current.active) return
    container.scrollLeft = panState.current.left - (event.clientX - panState.current.x)
    container.scrollTop = panState.current.top - (event.clientY - panState.current.y)
  }

  const endPan = () => {
    panState.current.active = false
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/10 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b-4 border-foreground bg-background p-4 flex flex-col sm:flex-row gap-4 justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="font-serif font-bold uppercase whitespace-nowrap">Categoría:</div>
          <div className="flex gap-2">
            {categories.filter(c => c.format === 'duelo' || c.format === '2v2').map(c => (
              <Button
                key={c.id}
                variant={selectedCat === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCat(c.id)}
                className="whitespace-nowrap"
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={handleResetZoom}><Maximize className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-auto relative bracket-container cursor-grab active:cursor-grabbing touch-none select-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)]"
        ref={containerRef}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div className="absolute top-4 left-4 font-mono text-xs text-muted-foreground flex items-center gap-2 bg-background/80 p-2 border-2 border-foreground z-10">
          <MousePointer2 className="h-4 w-4" /> ARRASTRE PARA NAVEGAR
        </div>
        
        {/* Scaled Content */}
        <div 
          className="min-w-[1200px] min-h-[800px] p-20 flex gap-20 transition-transform duration-200 origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          {catMatches.length === 0 ? (
            <div className="w-full text-center py-32 font-mono text-2xl text-muted-foreground uppercase border-4 border-dashed border-foreground/30">
              No hay llaves generadas para esta categoría
            </div>
          ) : (
            rounds.map(roundNum => {
              const roundMatches = catMatches.filter(m => m.round === roundNum)
              if (roundMatches.length === 0) return null
              
              return (
                <div key={roundNum} className="flex flex-col gap-12 justify-center">
                  <div className="text-center font-serif font-bold text-xl uppercase mb-4 sticky top-0 bg-background/90 p-2 border-2 border-foreground inline-block mx-auto">
                    {roundNum === 1 ? 'Octavos' : roundNum === 2 ? 'Cuartos' : 'Semifinal'}
                  </div>
                  {roundMatches.map(match => (
                    <div key={match.id} className="border-4 border-foreground bg-card w-64 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative group">
                      <div className="bg-foreground text-background font-mono text-xs font-bold px-2 py-1 flex justify-between uppercase">
                        <span>Match #{match.id.split('_')[1]}</span>
                        <span className={
                          match.status === 'completed' ? 'text-green-400' :
                          match.status === 'active' ? 'text-amber-400 animate-pulse' :
                          'text-muted'
                        }>
                          {match.status}
                        </span>
                      </div>
                      
                      <div className={`p-3 border-b-2 border-foreground flex justify-between items-center ${match.winner === 'A' ? 'bg-primary/10' : ''}`}>
                        <span className={`font-bold truncate max-w-[150px] ${match.winner === 'A' ? '' : 'text-muted-foreground'}`}>
                           {getTeamName(match.sideARobots)}
                        </span>
                        {match.winner === 'A' && <span className="font-black">★</span>}
                      </div>
                      <div className={`p-3 flex justify-between items-center ${match.winner === 'B' ? 'bg-primary/10' : ''}`}>
                        <span className={`font-bold truncate max-w-[150px] ${match.winner === 'B' ? '' : 'text-muted-foreground'}`}>
                           {getTeamName(match.sideBRobots)}
                        </span>
                        {match.winner === 'B' && <span className="font-black">★</span>}
                      </div>
                      
                      {/* Diagram connection lines - Simplified for visual effect */}
                      {roundNum < rounds.length && (
                        <>
                          <div className="absolute top-1/2 -right-10 w-10 h-1 bracket-line -translate-y-1/2 group-hover:bg-primary transition-colors"></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
