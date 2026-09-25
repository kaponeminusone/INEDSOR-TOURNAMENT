import { useState, useRef } from "react"
import { useData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, FileSpreadsheet, AlertTriangle } from "lucide-react"

export default function ControlImportar() {
  const { importData, categories } = useData()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    setFile(file)
    setError(null)
    setPreview([])

    if (file.name.endsWith('.xlsx')) {
      setError("La primera versión requiere exportar tu archivo a formato CSV. Por favor, abre tu Excel, ve a 'Guardar como' y elige 'CSV (delimitado por comas)'.")
      return
    }

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim().length > 0)
        if (lines.length > 1) {
          const headers = lines[0].split(',')
          const parsed = lines.slice(1, 4).map(line => {
            const values = line.split(',')
            return headers.reduce((obj, header, i) => {
              obj[header.trim()] = values[i]?.trim() || ''
              return obj
            }, {} as Record<string, string>)
          })
          setPreview(parsed)
        }
      }
      reader.readAsText(file)
    }
  }

  const processFile = () => {
    if (!file || !file.name.endsWith('.csv')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim().length > 0)
      if (lines.length < 2) return

      const headers = lines[0].split(',').map(h => h.trim())
      
      const newInstitutions: any[] = []
      const newParticipants: any[] = []
      const newRobots: any[] = []

      // Basic simple CSV parsing logic
      lines.slice(1).forEach(line => {
        const values = line.split(',').map(v => v.trim())
        const row = headers.reduce((obj, header, i) => {
          obj[header] = values[i] || ''
          return obj
        }, {} as Record<string, string>)

        // 1. Resolve institution
        let instId = `inst_${Date.now()}_${Math.random()}`
        let existingInst = newInstitutions.find(i => i.initials === row['sigla'] || i.name === row['institución'])
        if (!existingInst) {
          existingInst = { id: instId, name: row['institución'], initials: row['sigla'], coach: row['coach'] || '' }
          if (existingInst.name && existingInst.initials) {
            newInstitutions.push(existingInst)
          }
        } else {
          instId = existingInst.id
        }

        // 2. Create Robot
        const cat = categories.find(c => c.slug === row['categorías'])
        const robotId = `rob_${Date.now()}_${Math.random()}`
        if (row['robot']) {
          newRobots.push({
            id: robotId,
            name: row['robot'],
            categories: cat ? [cat.id] : []
          })
        }

        // 3. Resolve Participant
        let existingPart = newParticipants.find(p => p.email === row['correo'] && p.email !== '')
        if (!existingPart) {
          existingPart = newParticipants.find(p => p.name === row['nombre'] && p.institutionId === instId)
        }

        if (existingPart) {
          if (row['robot']) existingPart.robots.push(robotId)
        } else if (row['nombre']) {
          newParticipants.push({
            id: `part_${Date.now()}_${Math.random()}`,
            name: row['nombre'],
            email: row['correo'] || '',
            whatsapp: row['whatsapp'] || '',
            grade: row['grado'] || '',
            institutionId: instId,
            robots: row['robot'] ? [robotId] : []
          })
        }
      })

      importData(newInstitutions, newParticipants, newRobots)
      setFile(null)
      setPreview([])
      alert('Datos importados correctamente.')
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const headers = "institución,sigla,coach,nombre,correo,whatsapp,grado,robot,categorías\n"
    const demo = "Universidad Central,UC,Nikola Tesla,Maria Lopez,maria@test.com,555-1234,Tercer Semestre,Destructor V2,sumo-rc\n"
    const blob = new Blob([headers + demo], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_robotica.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-black uppercase mb-2">Importar Datos</h1>
        <p className="font-mono text-muted-foreground">Carga masiva de instituciones, participantes y robots.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            className="hidden" 
            accept=".csv,.xlsx" 
          />
          <Card 
            className={`border-4 border-dashed h-full cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-foreground/30'} transition-all`} 
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 h-full text-center">
              {file ? (
                <>
                  <FileSpreadsheet className="h-16 w-16 mb-4 text-green-500" />
                  <div className="font-bold text-xl uppercase mb-2">{file.name}</div>
                  <div className="font-mono text-sm text-muted-foreground mb-6">{(file.size / 1024).toFixed(1)} KB</div>
                  
                  {error ? (
                    <div className="text-destructive font-mono text-sm mb-6 max-w-xs">{error}</div>
                  ) : (
                    <div className="font-mono text-sm text-muted-foreground mb-6 border border-foreground/20 p-2 bg-muted text-left w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      Previsualización:<br/>
                      {preview.map((row, i) => <div key={i}>{JSON.stringify(row).substring(0, 50)}...</div>)}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}>CANCELAR</Button>
                    <Button disabled={!!error} onClick={(e) => { e.stopPropagation(); processFile(); }}>PROCESAR ARCHIVO</Button>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud className="h-16 w-16 mb-6 text-muted-foreground" />
                  <h3 className="font-serif text-2xl font-bold uppercase mb-2">Arrastra tu archivo CSV</h3>
                  <p className="font-mono text-muted-foreground mb-6">o haz clic para seleccionar desde tu dispositivo</p>
                  <Button variant="outline" className="border-2 border-foreground pointer-events-none">
                    SELECCIONAR ARCHIVO
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-foreground text-background border-4 border-foreground">
            <CardHeader className="border-b-2 border-background pb-4">
              <CardTitle className="text-xl">Formato Requerido</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 font-mono text-sm space-y-4">
              <p className="opacity-90">El archivo CSV debe contener las siguientes columnas exactas:</p>
              <ul className="list-disc pl-4 space-y-1 opacity-90">
                <li>institución</li>
                <li>sigla</li>
                <li>coach</li>
                <li>nombre</li>
                <li>correo</li>
                <li>whatsapp</li>
                <li>grado</li>
                <li>robot</li>
                <li>categorías</li>
              </ul>
              <Button onClick={downloadTemplate} variant="outline" className="w-full mt-4 bg-transparent border-background text-background hover:bg-background hover:text-foreground">
                DESCARGAR PLANTILLA
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="border-2 border-amber-500 bg-amber-500/10 p-6 flex gap-4 text-amber-900 dark:text-amber-400">
        <AlertTriangle className="shrink-0 h-6 w-6" />
        <div>
          <h4 className="font-bold uppercase mb-1">Emparejamiento Inteligente</h4>
          <p className="font-mono text-sm">
            La importación intentará emparejar los participantes existentes por su correo o combinación de nombre+institución.
            Si un participante ya existe, los nuevos robots se añadirán a su perfil sin duplicar su registro.
          </p>
        </div>
      </div>
    </div>
  )
}
