import { useState } from "react"
import { useData, type Participant, type Robot } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ControlHeader } from "@/components/page-header"
import { Plus, Search, Pencil } from "lucide-react"

export default function ControlParticipantes() {
  const { participants, institutions, robots, categories, addParticipant, updateParticipant, addRobot, updateRobot } = useData()
  const [activeTab, setActiveTab] = useState<"participants" | "robots">("participants")
  const [searchTerm, setSearchTerm] = useState("")
  const [partOpen, setPartOpen] = useState(false)
  const [robotOpen, setRobotOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null)
  const [partForm, setPartForm] = useState({ name: "", email: "", whatsapp: "", grade: "", institutionId: "" })
  const [robotForm, setRobotForm] = useState({ name: "", categoryIds: [] as string[], participantId: "" })

  const term = searchTerm.toLowerCase()
  const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(term))
  const filteredRobots = robots.filter(r => r.name.toLowerCase().includes(term))
  const isEmpty = activeTab === "participants" ? filteredParticipants.length === 0 : filteredRobots.length === 0

  const openNewParticipant = () => {
    setEditingParticipant(null)
    setPartForm({ name: "", email: "", whatsapp: "", grade: "", institutionId: "" })
    setPartOpen(true)
  }
  const openEditParticipant = (p: Participant) => {
    setEditingParticipant(p)
    setPartForm({ name: p.name, email: p.email, whatsapp: p.whatsapp, grade: p.grade, institutionId: p.institutionId })
    setPartOpen(true)
  }
  const openNewRobot = () => {
    setEditingRobot(null)
    setRobotForm({ name: "", categoryIds: [], participantId: "" })
    setRobotOpen(true)
  }
  const openEditRobot = (r: Robot) => {
    setEditingRobot(r)
    setRobotForm({ name: r.name, categoryIds: r.categories, participantId: r.participantId ?? "" })
    setRobotOpen(true)
  }
  const toggleRobotCategory = (categoryId: string) => {
    setRobotForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId) ? prev.categoryIds.filter(id => id !== categoryId) : [...prev.categoryIds, categoryId],
    }))
  }

  const handleSubmitParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = editingParticipant ? await updateParticipant(editingParticipant.id, partForm) : await addParticipant(partForm)
    if (!ok) return
    setPartOpen(false)
    setEditingParticipant(null)
    setPartForm({ name: "", email: "", whatsapp: "", grade: "", institutionId: "" })
  }

  const handleSubmitRobot = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { name: robotForm.name, categories: robotForm.categoryIds, participantId: robotForm.participantId || null }
    const ok = editingRobot ? await updateRobot(editingRobot.id, payload) : await addRobot(payload)
    if (!ok) return
    setRobotOpen(false)
    setEditingRobot(null)
    setRobotForm({ name: "", categoryIds: [], participantId: "" })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader
        title="Registros"
        description={`${participants.length} participantes · ${robots.length} robots`}
        actions={
          activeTab === "participants" ? (
            <div className="flex gap-2">
              <Button onClick={openNewParticipant}><Plus size={16} /> Nuevo participante</Button>
              <Dialog open={partOpen} onOpenChange={o => { setPartOpen(o); if (!o) setEditingParticipant(null) }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingParticipant ? "Editar participante" : "Nuevo participante"}</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmitParticipant} className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="p-name">Nombre</Label><Input id="p-name" required value={partForm.name} onChange={e => setPartForm({ ...partForm, name: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label htmlFor="p-inst">Institución</Label>
                      <select id="p-inst" required className="field-select" value={partForm.institutionId} onChange={e => setPartForm({ ...partForm, institutionId: e.target.value })}>
                        <option value="" disabled>Seleccionar…</option>
                        {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="p-email">Correo</Label><Input id="p-email" required type="email" value={partForm.email} onChange={e => setPartForm({ ...partForm, email: e.target.value })} /></div>
                      <div className="space-y-2"><Label htmlFor="p-wa">WhatsApp</Label><Input id="p-wa" required value={partForm.whatsapp} onChange={e => setPartForm({ ...partForm, whatsapp: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="p-grade">Grado</Label><Input id="p-grade" value={partForm.grade} onChange={e => setPartForm({ ...partForm, grade: e.target.value })} /></div>
                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setPartOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={openNewRobot}><Plus size={16} /> Nuevo robot</Button>
              <Dialog open={robotOpen} onOpenChange={o => { setRobotOpen(o); if (!o) setEditingRobot(null) }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editingRobot ? "Editar robot" : "Nuevo robot"}</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmitRobot} className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="r-name">Nombre del robot</Label><Input id="r-name" required value={robotForm.name} onChange={e => setRobotForm({ ...robotForm, name: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Categorías</Label>
                      <div className="flex flex-wrap gap-2 rounded-xl border border-input bg-card p-3">
                        {categories.map(c => {
                          const checked = robotForm.categoryIds.includes(c.id)
                          return (
                            <button
                              key={c.id}
                              type="button"
                              aria-pressed={checked}
                              onClick={() => toggleRobotCategory(c.id)}
                              className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${checked ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                            >
                              {c.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r-owner">Propietario</Label>
                      <select id="r-owner" className="field-select" value={robotForm.participantId} onChange={e => setRobotForm({ ...robotForm, participantId: e.target.value })}>
                        <option value="">Sin asignar</option>
                        {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setRobotOpen(false)}>Cancelar</Button>
                      <Button type="submit">Guardar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="segmented" role="group" aria-label="Tipo de registro">
          <button type="button" aria-pressed={activeTab === "participants"} onClick={() => setActiveTab("participants")}>Participantes</button>
          <button type="button" aria-pressed={activeTab === "robots"} onClick={() => setActiveTab("robots")}>Robots</button>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${activeTab === "participants" ? "participante" : "robot"}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Buscar"
          />
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <table className="table-apple min-w-[560px]">
          <thead>
            {activeTab === "participants" ? (
              <tr><th>Nombre</th><th>Contacto</th><th>Institución</th><th className="w-10"></th></tr>
            ) : (
              <tr><th>Robot</th><th>Categorías</th><th>Propietario</th><th className="w-10"></th></tr>
            )}
          </thead>
          <tbody>
            {activeTab === "participants" && filteredParticipants.map(p => (
              <tr key={p.id}>
                <td className="font-semibold tracking-[-0.015em]">{p.name}</td>
                <td className="text-[13px] text-muted-foreground">{p.email}<br />{p.whatsapp}</td>
                <td className="text-[14px]">{institutions.find(i => i.id === p.institutionId)?.name}</td>
                <td className="text-right">
                  <button type="button" title="Editar" aria-label={`Editar ${p.name}`} onClick={() => openEditParticipant(p)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {activeTab === "robots" && filteredRobots.map(r => (
              <tr key={r.id}>
                <td className="font-semibold tracking-[-0.015em]">{r.name}</td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {r.categories.map(cId => <Badge key={cId} variant="secondary">{categories.find(c => c.id === cId)?.name || cId}</Badge>)}
                    {r.categories.length === 0 && <span className="text-[12px] text-destructive">Sin categoría</span>}
                  </div>
                </td>
                <td className="text-[14px]">{participants.find(p => p.id === r.participantId)?.name || <span className="text-muted-foreground">No asignado</span>}</td>
                <td className="text-right">
                  <button type="button" title="Editar" aria-label={`Editar ${r.name}`} onClick={() => openEditRobot(r)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {isEmpty && (
              <tr><td colSpan={4} className="py-14 text-center text-muted-foreground">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
