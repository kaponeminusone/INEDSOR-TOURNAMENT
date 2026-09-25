import { useState } from "react"
import { useData } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { ControlHeader } from "@/components/page-header"
import { Search, CheckCircle2, UserPlus } from "lucide-react"

const emptyForm = {
  participantName: "", email: "", whatsapp: "", grade: "",
  institutionId: "", newInstitutionName: "",
  robotName: "", categoryId: "",
}

export default function ControlAttendance() {
  const { participants, institutions, robots, categories, markAttendance, addParticipantFull } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  const term = searchTerm.toLowerCase()
  const filteredParticipants = participants.filter(p => {
    const inst = institutions.find(i => i.id === p.institutionId)
    const robotNames = p.robots.map(rId => robots.find(r => r.id === rId)?.name.toLowerCase() || "")
    return p.name.toLowerCase().includes(term) ||
      inst?.name.toLowerCase().includes(term) ||
      inst?.initials.toLowerCase().includes(term) ||
      robotNames.some(name => name.includes(term))
  })
  const attended = participants.filter(p => p.attendedAt).length

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await addParticipantFull(formData))) return
    setOpen(false)
    setFormData(emptyForm)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader
        title="Asistencia"
        description={`${attended} de ${participants.length} participantes han llegado.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus size={16} /> Registro en sitio</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registro en sitio</DialogTitle>
                <DialogDescription>Inscribe a un participante que llegó sin registro previo y márcalo como presente.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="att-name">Nombre del participante</Label>
                    <Input id="att-name" required value={formData.participantName} onChange={e => setFormData({ ...formData, participantName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="att-inst">Institución</Label>
                    <select id="att-inst" className="field-select" required value={formData.institutionId} onChange={e => setFormData({ ...formData, institutionId: e.target.value })}>
                      <option value="" disabled>Seleccionar…</option>
                      <option value="new">+ Crear nueva institución</option>
                      {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                </div>

                {formData.institutionId === "new" && (
                  <div className="space-y-2">
                    <Label htmlFor="att-newinst">Nombre de la nueva institución</Label>
                    <Input id="att-newinst" required value={formData.newInstitutionName} onChange={e => setFormData({ ...formData, newInstitutionName: e.target.value })} />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="att-email">Correo</Label>
                    <Input id="att-email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="att-wa">WhatsApp</Label>
                    <Input id="att-wa" required value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="att-robot">Nombre del robot</Label>
                    <Input id="att-robot" required value={formData.robotName} onChange={e => setFormData({ ...formData, robotName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="att-cat">Categoría inicial</Label>
                    <select id="att-cat" className="field-select" required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                      <option value="" disabled>Seleccionar…</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit">Registrar y marcar presente</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 rounded-2xl pl-11 text-[16px]"
          placeholder="Buscar participante, institución, siglas o robot"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar"
        />
      </div>

      <div className="panel overflow-x-auto">
        <table className="table-apple min-w-[560px]">
          <thead>
            <tr>
              <th>Participante</th>
              <th className="hidden md:table-cell">Contacto</th>
              <th>Robots</th>
              <th className="text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.map(p => {
              const inst = institutions.find(i => i.id === p.institutionId)
              const participantRobots = p.robots.map(rId => robots.find(r => r.id === rId)).filter(Boolean)
              return (
                <tr key={p.id}>
                  <td>
                    <div className="font-semibold tracking-[-0.015em]">{p.name}</div>
                    <div className="text-[13px] text-muted-foreground">{inst?.name}{inst?.initials ? ` · ${inst.initials}` : ""}</div>
                  </td>
                  <td className="hidden text-[13px] text-muted-foreground md:table-cell">
                    {p.email}<br />{p.whatsapp}
                  </td>
                  <td>
                    <ul className="space-y-1.5">
                      {participantRobots.map(r => (
                        <li key={r!.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[14px] font-medium">{r!.name}</span>
                          {r!.categories.map(cId => (
                            <Badge key={cId} variant="secondary" className="text-[11px]">{categories.find(c => c.id === cId)?.name ?? "Categoría eliminada"}</Badge>
                          ))}
                          {r!.categories.length === 0 && <span className="text-[12px] text-destructive">Sin categoría</span>}
                        </li>
                      ))}
                      {participantRobots.length === 0 && <li className="text-[13px] text-muted-foreground">Sin robots</li>}
                    </ul>
                  </td>
                  <td className="text-right">
                    {p.attendedAt ? (
                      <span className="inline-flex flex-col items-end">
                        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-success">
                          <CheckCircle2 size={16} /> Presente
                        </span>
                        <span className="tabular text-[12px] text-muted-foreground">
                          {new Date(p.attendedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void markAttendance(p.id)}>Marcar llegada</Button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredParticipants.length === 0 && (
              <tr>
                <td colSpan={4} className="py-14 text-center text-muted-foreground">
                  No hay resultados para “{searchTerm}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
