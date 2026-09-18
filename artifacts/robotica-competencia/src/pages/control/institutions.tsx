import { useState, useRef } from "react"
import { useData, Institution } from "@/lib/data"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building2, Pencil, Trash2, Image as ImageIcon, Upload, X } from "lucide-react"

export default function ControlInstituciones() {
  const { institutions, updateInstitution } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editData, setEditData] = useState<{name: string, coach: string, initials: string}>({ name: '', coach: '', initials: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startEdit = (inst: Institution) => {
    setEditingId(inst.id)
    setEditData({ name: inst.name, coach: inst.coach, initials: inst.initials })
  }

  const saveEdit = (id: string) => {
    updateInstitution(id, editData)
    setEditingId(null)
  }

  const handleLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen.')
      return
    }

    // Convert to Base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64.length > 500 * 1024) { // ~500kb approx
         alert('La imagen es muy grande. Usa una imagen menor de 500 KB.')
         e.target.value = ''
         return
      }
      updateInstitution(id, { logo: base64 })
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = (id: string) => {
    updateInstitution(id, { logo: undefined })
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-5xl">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-black uppercase mb-2">Instituciones</h1>
          <p className="font-mono text-muted-foreground">Gestiona los logos y detalles de los colegios participantes.</p>
        </div>
      </div>

      <div className="space-y-4">
        {institutions.map(inst => (
          <Card key={inst.id} className="overflow-hidden border-border rounded-none">
            <CardContent className="p-0 flex flex-col md:flex-row">
              {/* Logo Column */}
              <div className="w-full md:w-48 bg-muted/50 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col items-center justify-center gap-4 shrink-0 relative group">
                <div className="w-24 h-24 bg-background border border-border flex items-center justify-center overflow-hidden">
                  {inst.logo ? (
                    <img src={inst.logo} alt={inst.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-4xl font-serif font-bold text-muted-foreground opacity-50">{inst.initials}</div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-foreground text-background px-3 py-1.5 text-xs font-mono font-bold hover:bg-foreground/80 transition-colors inline-flex items-center gap-2">
                    <Upload className="h-3 w-3" />
                    SUBIR
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleLogoUpload(inst.id, e)} 
                    />
                  </label>
                  {inst.logo && (
                    <button 
                      onClick={() => removeLogo(inst.id)}
                      className="bg-destructive text-destructive-foreground px-2 py-1.5 text-xs hover:bg-destructive/80 transition-colors"
                      title="Eliminar logo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Data Column */}
              <div className="p-6 flex-1 flex flex-col justify-center">
                {editingId === inst.id ? (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="font-mono text-xs uppercase text-muted-foreground mb-1 block">Nombre Institución</label>
                      <Input 
                        value={editData.name} 
                        onChange={(e) => setEditData({...editData, name: e.target.value})} 
                        className="rounded-none border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-mono text-xs uppercase text-muted-foreground mb-1 block">Siglas</label>
                        <Input 
                          value={editData.initials} 
                          onChange={(e) => setEditData({...editData, initials: e.target.value})} 
                          className="rounded-none border-border uppercase font-mono"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="font-mono text-xs uppercase text-muted-foreground mb-1 block">Coach</label>
                        <Input 
                          value={editData.coach} 
                          onChange={(e) => setEditData({...editData, coach: e.target.value})} 
                          className="rounded-none border-border"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => saveEdit(inst.id)} className="rounded-none">GUARDAR</Button>
                      <Button onClick={() => setEditingId(null)} variant="outline" className="rounded-none">CANCELAR</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-serif text-2xl font-bold uppercase mb-1">{inst.name}</div>
                      <div className="font-mono text-sm text-muted-foreground flex gap-4">
                        <span><strong className="text-foreground">SIGLA:</strong> {inst.initials}</span>
                        <span><strong className="text-foreground">COACH:</strong> {inst.coach || 'Sin asignar'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(inst)} className="rounded-none hover:bg-muted">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {institutions.length === 0 && (
          <div className="p-12 text-center border border-border bg-muted/30">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-mono text-muted-foreground">No hay instituciones registradas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
