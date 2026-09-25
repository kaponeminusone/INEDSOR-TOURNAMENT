import { useMemo, useState } from "react"
import { Search, Trophy, X } from "lucide-react"
import type { EntrantInfo } from "@/lib/data"
import type { Competition, Places } from "@/lib/competition"

type Props = {
  competition: Competition
  places: Places | null
  describe: (key: string) => EntrantInfo
  editable?: boolean
  editMode?: boolean
  onSave?: (places: Places) => void
}

const medal = ["text-gold", "text-silver", "text-bronze"]
const placeName = ["1.er puesto", "2.º puesto", "3.er puesto"]

export function DirectBoard({ competition, places, describe, editable, editMode, onSave }: Props) {
  const count = competition.settings.places
  const [picked, setPicked] = useState<(string | null)[]>(() => Array.from({ length: count }, (_, i) => places?.[i]?.[0] ?? null))
  const [active, setActive] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const canEdit = editable && (competition.status !== "finished" || editMode)

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    return competition.entrants
      .map(e => describe(e.key))
      .filter(info => !picked.includes(info.key))
      .filter(info => !q || info.name.toLowerCase().includes(q) || info.school.toLowerCase().includes(q) || info.schoolInitials.toLowerCase().includes(q))
      .slice(0, 8)
  }, [competition.entrants, describe, picked, query])

  const choose = (key: string) => {
    if (active === null) return
    setPicked(list => list.map((k, i) => (i === active ? key : k)))
    setQuery("")
    setActive(picked.findIndex((k, i) => !k && i !== active) >= 0 ? picked.findIndex((k, i) => !k && i !== active) : null)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Resultado</h3>
        <div className="space-y-3">
          {Array.from({ length: count }, (_, i) => {
            const key = canEdit ? picked[i] : places?.[i]?.[0] ?? null
            const info = key ? describe(key) : null
            return (
              <div key={i} className={`panel p-4 ${active === i ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-center gap-3">
                  <Trophy size={22} className={medal[i]} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-muted-foreground">{placeName[i]}</div>
                    <div className={`truncate text-[17px] font-semibold tracking-[-0.02em] ${info ? "" : "text-muted-foreground/60"}`}>{info ? info.name : "Sin asignar"}</div>
                    {info && <div className="truncate text-[12px] text-muted-foreground">{info.school}</div>}
                  </div>
                  {canEdit && key && <button type="button" onClick={() => setPicked(list => list.map((k, j) => (j === i ? null : k)))} aria-label="Quitar" className="grid h-8 w-8 place-items-center rounded-full bg-muted"><X size={14} /></button>}
                  {canEdit && !key && <button type="button" onClick={() => setActive(i)} className="btn-pill btn-secondary btn-sm">Elegir</button>}
                </div>
                {canEdit && active === i && (
                  <div className="mt-3">
                    <div className="relative">
                      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Escribe el nombre del robot o el colegio" className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-[15px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
                    </div>
                    <ul className="mt-2 max-h-72 overflow-y-auto">
                      {options.map(info => (
                        <li key={info.key}>
                          <button type="button" onClick={() => choose(info.key)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted">
                            <span className="truncate text-[15px] font-medium">{info.name}</span>
                            <span className="shrink-0 text-[12px] text-muted-foreground">{info.schoolInitials}</span>
                          </button>
                        </li>
                      ))}
                      {options.length === 0 && <li className="px-3 py-3 text-[14px] text-muted-foreground">Sin coincidencias.</li>}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {canEdit && (
          <button type="button" disabled={!picked[0]} onClick={() => onSave?.(picked.filter((k): k is string => Boolean(k)).map(k => [k]))} className="btn-pill btn-primary mt-5 w-full sm:w-auto">
            Guardar resultado y finalizar
          </button>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Participantes · {competition.entrants.length}</h3>
        <ul className="panel divide-y divide-border">
          {competition.entrants.map(e => {
            const info = describe(e.key)
            return (
              <li key={e.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate text-[14px] font-medium">{info.name}</span>
                <span className="shrink-0 text-[12px] text-muted-foreground">{info.schoolInitials}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
