import { useState, useRef } from "react"
import { useData } from "@/lib/data"
import { buildImportPlan, parseCsv, CSV_COLUMNS, type ImportPlan } from "@/lib/csv-import"
import { Button } from "@/components/ui/button"
import { ControlHeader } from "@/components/page-header"
import { UploadCloud, FileSpreadsheet, Info, Download, AlertTriangle } from "lucide-react"

export default function ControlImportar() {
  const { importData, categories, institutions, participants, robots } = useData()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null); setPlan(null); setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

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
    if (e.dataTransfer.files?.[0]) void handleFileSelection(e.dataTransfer.files[0])
  }

  const handleFileSelection = async (selected: File) => {
    setFile(selected)
    setError(null)
    setPlan(null)
    if (/\.xlsx?$/i.test(selected.name)) {
      setError("Guarda el archivo como CSV: en Excel ve a Archivo → Guardar como → «CSV UTF-8 (delimitado por comas)».")
      return
    }
    const rows = parseCsv(await selected.text())
    if (rows.length === 0) { setError("El archivo no tiene filas de datos."); return }
    const next = buildImportPlan(rows, { institutions, participants, robots, categories })
    if (next.missingColumns.length) { setError(`Faltan columnas: ${next.missingColumns.join(", ")}.`); return }
    setPlan(next)
  }

  const processFile = async () => {
    if (!plan) return
    setBusy(true)
    const ok = await importData(plan.institutions, plan.participants, plan.robots)
    setBusy(false)
    if (ok) reset()
  }

  const downloadTemplate = () => {
    const example = "Colegio Ejemplo,CE,Nombre del coach,Nombre del estudiante,correo@ejemplo.com,3000000000,10°,Nombre del robot,sumo-rc|futbolito\n"
    const blob = new Blob(["﻿" + CSV_COLUMNS.join(",") + "\n" + example], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_inscritos.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const newParticipants = plan ? plan.participants.filter(p => !p.existing).length : 0

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader title="Importar datos" description="Carga masiva de instituciones, participantes y robots desde un CSV." />

      <div className="grid gap-5 md:grid-cols-[1.6fr_1fr]">
        <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && void handleFileSelection(e.target.files[0])} className="hidden" accept=".csv,.xlsx,.xls" />
        <div
          role="button"
          tabIndex={file ? -1 : 0}
          aria-label="Seleccionar archivo CSV"
          className={`flex min-h-[340px] flex-col items-center justify-center rounded-[22px] border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/[.05]" : "border-input bg-card"} ${file ? "" : "cursor-pointer hover:border-primary/60"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          onKeyDown={(e) => { if (!file && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileInputRef.current?.click() } }}
        >
          {file ? (
            <>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-success/10 text-success"><FileSpreadsheet size={26} /></div>
              <div className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">{file.name}</div>
              <div className="text-[13px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>

              {error && <p className="mt-5 max-w-sm text-[14px] text-destructive">{error}</p>}

              {plan && (
                <div className="mt-6 w-full max-w-md text-left">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { n: plan.institutions.length, l: "instituciones nuevas" },
                      { n: newParticipants, l: "participantes nuevos" },
                      { n: plan.robots.length, l: "robots nuevos" },
                    ].map(item => (
                      <div key={item.l} className="rounded-xl bg-muted px-2 py-3">
                        <div className="text-[24px] font-semibold tracking-[-0.03em]">{item.n}</div>
                        <div className="text-[11px] leading-tight text-muted-foreground">{item.l}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-muted-foreground">
                    {plan.rows} filas leídas.
                    {plan.existingParticipants > 0 && ` ${plan.existingParticipants} participantes ya existían y no se duplican.`}
                    {plan.skippedRobots > 0 && ` ${plan.skippedRobots} robots ya estaban registrados y se omiten.`}
                  </p>
                  {plan.unknownCategories.length > 0 && (
                    <p className="mt-3 flex gap-2 rounded-xl bg-[hsl(40_90%_48%/0.12)] p-3 text-[13px] text-foreground/80">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold" />
                      <span>Categorías no reconocidas (esos robots quedarán sin esa categoría): {plan.unknownCategories.join(", ")}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="secondary" onClick={(e) => { e.stopPropagation(); reset() }}>Cancelar</Button>
                <Button disabled={!plan || busy} onClick={(e) => { e.stopPropagation(); void processFile() }}>{busy ? "Importando…" : "Importar"}</Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UploadCloud size={26} /></div>
              <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.025em]">Arrastra tu archivo CSV</h2>
              <p className="mt-1 text-[15px] text-muted-foreground">o haz clic para seleccionarlo desde tu dispositivo</p>
            </>
          )}
        </div>

        <div className="panel flex flex-col p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.02em]">Formato</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">Una fila por robot, con estas columnas (separadas por coma o punto y coma):</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CSV_COLUMNS.map(col => <span key={col} className="chip font-mono text-[12px]">{col}</span>)}
          </div>
          <p className="mt-5 text-[14px] text-muted-foreground">En <span className="font-mono text-[12px]">categorías</span>, usa estos identificadores; varias se separan con <span className="font-mono">|</span>:</p>
          <ul className="mt-2 space-y-1 text-[13px]">
            {categories.map(c => (
              <li key={c.id} className="flex justify-between gap-3"><span className="font-mono text-[12px]">{c.slug}</span><span className="truncate text-muted-foreground">{c.name}</span></li>
            ))}
          </ul>
          <Button onClick={downloadTemplate} variant="outline" className="mt-6 w-full" size="sm">
            <Download size={15} /> Descargar plantilla
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-3 rounded-[18px] bg-primary/[.06] p-5 text-[14px]">
        <Info size={18} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-foreground/80">
          <span className="font-semibold text-foreground">Sin duplicados.</span> Las instituciones se reconocen por sigla o nombre, y los participantes por correo (o por nombre e institución). Si un estudiante tiene varios robots, repite su fila con cada robot. Puedes importar el mismo archivo otra vez sin duplicar registros.
        </p>
      </div>
    </div>
  )
}
