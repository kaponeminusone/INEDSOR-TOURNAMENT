import { useState } from "react"
import { useData, Institution } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ControlHeader } from "@/components/page-header"
import { InstitutionLogo } from "@/components/institution-logo"
import { Building2, Pencil, Trash2, Upload } from "lucide-react"

export default function ControlInstituciones() {
  const { institutions, updateInstitution, setInstitutionLogo } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: "", coach: "", initials: "" })

  const startEdit = (inst: Institution) => {
    setEditingId(inst.id)
    setEditData({ name: inst.name, coach: inst.coach, initials: inst.initials })
  }

  const saveEdit = async (id: string) => {
    if (await updateInstitution(id, editData)) setEditingId(null)
  }

  const handleLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen.")
      return
    }
    await setInstitutionLogo(id, file)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader title="Instituciones" description="Logos y datos de los colegios participantes." />

      <div className="space-y-4">
        {institutions.map(inst => (
          <div key={inst.id} className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:gap-3">
              <InstitutionLogo institution={inst} className="h-20 w-20 rounded-2xl text-[22px]" />
              <div className="flex gap-1.5">
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-muted px-3 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-[hsl(240_6%_90%)]">
                  <Upload size={13} /> Logo
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => void handleLogoUpload(inst.id, e)} />
                </label>
                {inst.logo && (
                  <button
                    onClick={() => void setInstitutionLogo(inst.id, null)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Eliminar logo"
                    aria-label="Eliminar logo"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {editingId === inst.id ? (
                <div className="max-w-lg space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`inst-name-${inst.id}`}>Nombre</Label>
                    <Input id={`inst-name-${inst.id}`} value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`inst-ini-${inst.id}`}>Siglas</Label>
                      <Input id={`inst-ini-${inst.id}`} value={editData.initials} onChange={(e) => setEditData({ ...editData, initials: e.target.value })} className="uppercase" maxLength={5} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`inst-coach-${inst.id}`}>Coach</Label>
                      <Input id={`inst-coach-${inst.id}`} value={editData.coach} onChange={(e) => setEditData({ ...editData, coach: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveEdit(inst.id)}>Guardar</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[21px] font-semibold leading-tight tracking-[-0.025em]">{inst.name}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted-foreground">
                      <span>Siglas: <span className="text-foreground">{inst.initials}</span></span>
                      <span>Coach: <span className="text-foreground">{inst.coach || "Sin asignar"}</span></span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(inst)} aria-label={`Editar ${inst.name}`}>
                    <Pencil size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {institutions.length === 0 && (
          <div className="panel flex flex-col items-center p-14 text-center text-muted-foreground">
            <Building2 size={32} strokeWidth={1.5} />
            <p className="mt-3">No hay instituciones registradas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
