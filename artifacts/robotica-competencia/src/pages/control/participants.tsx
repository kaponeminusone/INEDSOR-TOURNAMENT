import { useState } from "react"
import { useData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Users, Bot } from "lucide-react"

export default function ControlParticipantes() {
  const { participants, institutions, robots, categories, addParticipant, addRobot } = useData()
  const [activeTab, setActiveTab] = useState<'participants' | 'robots'>('participants')
  const [searchTerm, setSearchTerm] = useState("")

  const [partOpen, setPartOpen] = useState(false)
  const [robotOpen, setRobotOpen] = useState(false)

  const [partForm, setPartForm] = useState({ name: '', email: '', whatsapp: '', grade: '', institutionId: '' })
  const [robotForm, setRobotForm] = useState({ name: '', categoryId: '' })

  const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredRobots = robots.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreateParticipant = (e: React.FormEvent) => {
    e.preventDefault()
    addParticipant({ ...partForm, robots: [] })
    setPartOpen(false)
    setPartForm({ name: '', email: '', whatsapp: '', grade: '', institutionId: '' })
  }

  const handleCreateRobot = (e: React.FormEvent) => {
    e.preventDefault()
    addRobot({ name: robotForm.name, categories: [robotForm.categoryId] })
    setRobotOpen(false)
    setRobotForm({ name: '', categoryId: '' })
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-6xl">
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-serif font-black uppercase mb-2">Directorio de Registros</h1>
          <p className="font-mono text-muted-foreground">Gestión de competidores y robots inscritos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === 'participants' ? 'default' : 'outline'} onClick={() => setActiveTab('participants')}>
            <Users className="mr-2 h-4 w-4" /> PARTICIPANTES
          </Button>
          <Button variant={activeTab === 'robots' ? 'default' : 'outline'} onClick={() => setActiveTab('robots')}>
            <Bot className="mr-2 h-4 w-4" /> ROBOTS
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder={`Buscar ${activeTab === 'participants' ? 'participante' : 'robot'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        
        {activeTab === 'participants' ? (
          <Dialog open={partOpen} onOpenChange={setPartOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="shrink-0 border-2 border-foreground">+ NUEVO PARTICIPANTE</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Participante</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateParticipant} className="space-y-4">
                <div className="space-y-2"><Label>Nombre</Label><Input required value={partForm.name} onChange={e=>setPartForm({...partForm, name: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Institución</Label>
                  <select required className="flex h-12 w-full border-2 border-foreground bg-background px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={partForm.institutionId} onChange={e=>setPartForm({...partForm, institutionId: e.target.value})}>
                    <option value="" disabled>Seleccionar...</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Correo</Label><Input required type="email" value={partForm.email} onChange={e=>setPartForm({...partForm, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>WhatsApp</Label><Input required value={partForm.whatsapp} onChange={e=>setPartForm({...partForm, whatsapp: e.target.value})} /></div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={()=>setPartOpen(false)}>CANCELAR</Button>
                  <Button type="submit">GUARDAR</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={robotOpen} onOpenChange={setRobotOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="shrink-0 border-2 border-foreground">+ NUEVO ROBOT</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Robot</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateRobot} className="space-y-4">
                <div className="space-y-2"><Label>Nombre Robot</Label><Input required value={robotForm.name} onChange={e=>setRobotForm({...robotForm, name: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select required className="flex h-12 w-full border-2 border-foreground bg-background px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={robotForm.categoryId} onChange={e=>setRobotForm({...robotForm, categoryId: e.target.value})}>
                    <option value="" disabled>Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={()=>setRobotOpen(false)}>CANCELAR</Button>
                  <Button type="submit">GUARDAR</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border-4 border-foreground bg-card overflow-hidden">
        <table className="table-layout">
          <thead className="bg-muted">
            {activeTab === 'participants' ? (
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Institución</th>
              </tr>
            ) : (
              <tr>
                <th>Nombre Robot</th>
                <th>Categorías</th>
                <th>Propietario / Capitán</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTab === 'participants' && filteredParticipants.map(p => {
              const inst = institutions.find(i => i.id === p.institutionId)
              return (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="font-bold uppercase">{p.name}</td>
                  <td className="font-mono text-sm">{p.email}<br/>{p.whatsapp}</td>
                  <td className="font-mono text-sm">{inst?.name}</td>
                </tr>
              )
            })}
            
            {activeTab === 'robots' && filteredRobots.map(r => {
              const owner = participants.find(p => p.robots.includes(r.id))
              return (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="font-bold uppercase text-lg">{r.name}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {r.categories.map(cId => {
                        const cat = categories.find(c => c.id === cId)
                        return <Badge key={cId} variant="outline" className="text-xs">{cat?.name || cId}</Badge>
                      })}
                    </div>
                  </td>
                  <td className="font-mono text-sm">{owner?.name || 'No asignado'}</td>
                </tr>
              )
            })}

            {(activeTab === 'participants' && filteredParticipants.length === 0) || (activeTab === 'robots' && filteredRobots.length === 0) ? (
              <tr>
                <td colSpan={3} className="p-8 text-center font-mono text-muted-foreground">
                  Sin resultados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
