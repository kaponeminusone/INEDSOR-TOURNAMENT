import { useEffect, useState } from "react"
import { KeyRound } from "lucide-react"
import { useData } from "@/lib/data"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function EditModeToggle() {
  const { editModeUntil, startEditMode, endEditMode } = useData()
  const [asking, setAsking] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [, tick] = useState(0)

  useEffect(() => {
    if (!editModeUntil) return
    const timer = window.setInterval(() => tick(t => t + 1), 1000)
    return () => window.clearInterval(timer)
  }, [editModeUntil])

  const remaining = editModeUntil ? Math.max(0, editModeUntil - Date.now()) : 0
  const mm = Math.floor(remaining / 60000)
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const message = await startEditMode(code.trim())
    setBusy(false)
    if (message) { setError(message); return }
    setAsking(false); setCode(""); setError(null)
  }

  return (
    <>
      <label className={`flex cursor-pointer items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-[14px] font-medium transition-colors ${editModeUntil ? "bg-destructive/10 text-destructive" : "bg-card text-foreground/80 shadow-[inset_0_0_0_1px_hsl(var(--border))]"}`}>
        <KeyRound size={15} />
        {editModeUntil ? <span className="tabular">Modo edición · {mm}:{ss}</span> : "Modo edición"}
        <Switch checked={Boolean(editModeUntil)} onCheckedChange={on => (on ? setAsking(true) : void endEditMode())} aria-label="Modo edición" />
      </label>

      <Dialog open={asking} onOpenChange={open => { setAsking(open); if (!open) { setCode(""); setError(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modo edición</DialogTitle>
            <DialogDescription>Permite cambiar resultados ya guardados durante 15 minutos. Requiere el código del administrador.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <input
              autoFocus
              type="password"
              autoComplete="off"
              value={code}
              onChange={e => { setCode(e.target.value); setError(null) }}
              placeholder="Código de edición"
              className={`h-12 w-full rounded-xl border bg-card px-4 text-[17px] outline-none focus:ring-4 ${error ? "border-destructive focus:ring-destructive/15" : "border-input focus:border-primary focus:ring-primary/15"}`}
            />
            {error && <p className="text-[14px] text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAsking(false)}>Cancelar</Button>
              <Button type="submit" disabled={!code || busy}>{busy ? "Verificando…" : "Activar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
