import { useState } from "react"
import { useData } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Search, CheckCircle2, Clock, UserPlus } from "lucide-react"

export default function ControlAttendance() {
  const { participants, institutions, robots, categories, markAttendance, addParticipantFull } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    participantName: '', email: '', whatsapp: '', grade: '',
    institutionId: '', newInstitutionName: '',
    robotName: '', categoryId: ''
  })

  const filteredParticipants = participants.filter(p => {
    const term = searchTerm.toLowerCase()
    const inst = institutions.find(i => i.id === p.institutionId)
    const pRobots = p.robots.map(rId => robots.find(r => r.id === rId)?.name.toLowerCase() || "")
    const matchesRobot = pRobots.some(rName => rName.includes(term))
    
    return p.name.toLowerCase().includes(term) || 
           (inst?.name.toLowerCase().includes(term)) ||
           (inst?.initials.toLowerCase().includes(term)) ||
           matchesRobot
  })

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    addParticipantFull(formData)
    setOpen(false)
    setFormData({
      participantName: '', email: '', whatsapp: '', grade: '',
      institutionId: '', newInstitutionName: '',
      robotName: '', categoryId: ''
    })
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-6xl">
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-serif font-black uppercase mb-2">Control de Asistencia</h1>
          <p className="font-mono text-muted-foreground">Registro de delegaciones y homologación inicial.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2">
              <UserPlus className="h-4 w-4" /> REGISTRO EXTRAOFICIAL
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registro Extraoficial</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Participante</Label>
                  <Input required value={formData.participantName} onChange={e => setFormData({...formData, participantName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Institución</Label>
                  <select 
                    className="flex h-12 w-full border-2 border-foreground bg-background px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    value={formData.institutionId}
                    onChange={e => setFormData({...formData, institutionId: e.target.value})}
                  >
                    <option value="" disabled>Seleccionar...</option>
                    <option value="new">+ Crear nueva institución</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              </div>

              {formData.institutionId === 'new' && (
                <div className="space-y-2">
                  <Label>Nombre Nueva Institución</Label>
                  <Input required value={formData.newInstitutionName} onChange={e => setFormData({...formData, newInstitutionName: e.target.value})} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-foreground">
                <div className="space-y-2">
                  <Label>Nombre del Robot</Label>
                  <Input required value={formData.robotName} onChange={e => setFormData({...formData, robotName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría Inicial</Label>
                  <select 
                    className="flex h-12 w-full border-2 border-foreground bg-background px-4 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>CANCELAR</Button>
                <Button type="submit">REGISTRAR Y MARCAR PRESENTE</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-4 border-foreground bg-card mb-8 p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            className="pl-12 h-14 text-lg" 
            placeholder="Buscar participante, institución, iniciales o robot..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border-2 border-foreground bg-card overflow-hidden">
        <table className="table-layout">
          <thead className="bg-foreground text-background">
            <tr>
              <th className="!bg-transparent text-background">Participante / Institución</th>
              <th className="!bg-transparent text-background hidden md:table-cell">Contacto</th>
              <th className="!bg-transparent text-background">Robots</th>
              <th className="!bg-transparent text-background text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.map(p => {
              const inst = institutions.find(i => i.id === p.institutionId)
              const participantRobots = p.robots.map(rId => robots.find(r => r.id === rId)).filter(Boolean)
              
              return (
                <tr key={p.id} className={`hover:bg-muted/50 transition-colors ${p.attendedAt ? 'bg-muted/30' : ''}`}>
                  <td>
                    <div className="font-bold text-lg uppercase">{p.name}</div>
                    <div className="font-mono text-sm text-muted-foreground mt-1">
                      {inst?.name} ({inst?.initials})
                    </div>
                  </td>
                  <td className="hidden md:table-cell font-mono text-sm">
                    {p.email}<br/>
                    {p.whatsapp}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {participantRobots.map(r => (
                        <Badge key={r?.id} variant="outline" className="bg-background">{r?.name}</Badge>
                      ))}
                      {participantRobots.length === 0 && <span className="text-muted-foreground font-mono text-xs">Sin robots</span>}
                    </div>
                  </td>
                  <td className="text-right align-middle">
                    {p.attendedAt ? (
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent gap-1">
                          <CheckCircle2 className="h-3 w-3" /> PRESENTE
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(p.attendedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => markAttendance(p.id)}>
                        MARCAR LLEGADA
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredParticipants.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center font-mono text-muted-foreground">
                  No se encontraron resultados para "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
