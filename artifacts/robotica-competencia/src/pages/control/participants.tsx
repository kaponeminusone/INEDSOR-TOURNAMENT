import { useState } from "react"
import { useData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { ControlHeader } from "@/components/page-header"
import { Plus, Search } from "lucide-react"

export default function ControlParticipantes() {
  const { participants, institutions, robots, categories, addParticipant, addRobot } = useData()
  const [activeTab, setActiveTab] = useState<"participants" | "robots">("participants")
  const [searchTerm, setSearchTerm] = useState("")
  const [partOpen, setPartOpen] = useState(false)
  const [robotOpen, setRobotOpen] = useState(false)
  const [partForm, setPartForm] = useState({ name: "", email: "", whatsapp: "", grade: "", institutionId: "" })
  const [robotForm, setRobotForm] = useState({ name: "", categoryId: "", participantId: "" })

  const term = searchTerm.toLowerCase()
  const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(term))
  const filteredRobots = robots.filter(r => r.name.toLowerCase().includes(term))
  const isEmpty = activeTab === "participants" ? filteredParticipants.length === 0 : filteredRobots.length === 0

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await addParticipant(partForm))) return
    setPartOpen(false)
    setPartForm({ name: "", email: "", whatsapp: "", grade: "", institutionId: "" })
  }

  const handleCreateRobot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await addRobot({ name: robotForm.name, categories: [robotForm.categoryId], participantId: robotForm.participantId || null }))) return
    setRobotOpen(false)
    setRobotForm({ name: "", categoryId: "", participantId: "" })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader
        title="Registros"
        description={`${participants.length} participantes · ${robots.length} robots`}
        actions={
          activeTab === "participants" ? (
            <Dialog open={partOpen} onOpenChange={setPartOpen}>
              <DialogTrigger asChild>
                <Button><Plus size={16} /> Nuevo participante</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo participante</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateParticipant} className="space-y-4">
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
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setPartOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={robotOpen} onOpenChange={setRobotOpen}>
              <DialogTrigger asChild>
                <Button><Plus size={16} /> Nuevo robot</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo robot</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateRobot} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="r-name">Nombre del robot</Label><Input id="r-name" required value={robotForm.name} onChange={e => setRobotForm({ ...robotForm, name: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label htmlFor="r-cat">Categoría</Label>
                    <select id="r-cat" required className="field-select" value={robotForm.categoryId} onChange={e => setRobotForm({ ...robotForm, categoryId: e.target.value })}>
                      <option value="" disabled>Seleccionar…</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
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
              <tr><th>Nombre</th><th>Contacto</th><th>Institución</th></tr>
            ) : (
              <tr><th>Robot</th><th>Categorías</th><th>Propietario</th></tr>
            )}
          </thead>
          <tbody>
            {activeTab === "participants" && filteredParticipants.map(p => (
              <tr key={p.id}>
                <td className="font-semibold tracking-[-0.015em]">{p.name}</td>
                <td className="text-[13px] text-muted-foreground">{p.email}<br />{p.whatsapp}</td>
                <td className="text-[14px]">{institutions.find(i => i.id === p.institutionId)?.name}</td>
              </tr>
            ))}
            {activeTab === "robots" && filteredRobots.map(r => (
              <tr key={r.id}>
                <td className="font-semibold tracking-[-0.015em]">{r.name}</td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {r.categories.map(cId => <Badge key={cId} variant="secondary">{categories.find(c => c.id === cId)?.name || cId}</Badge>)}
                  </div>
                </td>
                <td className="text-[14px]">{participants.find(p => p.id === r.participantId)?.name || <span className="text-muted-foreground">No asignado</span>}</td>
              </tr>
            ))}
            {isEmpty && (
              <tr><td colSpan={3} className="py-14 text-center text-muted-foreground">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
