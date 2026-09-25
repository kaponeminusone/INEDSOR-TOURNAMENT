import { ReactNode, useEffect, useState } from "react"
import { Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { ArrowRight, LockKeyhole } from "lucide-react"
import { Navbar, BrandMark } from "@/components/layout/navbar"
import { ControlSidebar } from "@/components/layout/control-sidebar"
import { LiveStreamWidget } from "@/components/live-stream-widget"
import { useData } from "@/lib/data"

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const { isLoggedIn, login, configured, loading, loadError } = useData()
  const isControlPanel = location.startsWith("/control")
  // /bracket y /envivo ya muestran su propia previsualización de transmisiones.
  const hasOwnStreamPreview = location === "/bracket" || location === "/envivo"

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }, [location])

  if (!configured) return <StatusScreen title="Falta conectar la base de datos." text="Define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env.local de la aplicación y reinicia el servidor." />
  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background" role="status" aria-label="Cargando">
        <span className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-muted border-t-foreground/60" />
      </div>
    )
  }
  if (loadError) return <StatusScreen title="No pudimos cargar el torneo." text={loadError} retry />


  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <Navbar />
      <div className={`relative flex flex-1 flex-col md:flex-row ${isControlPanel && isLoggedIn ? "bg-[hsl(240_11%_97.5%)]" : ""}`}>
        {isControlPanel && isLoggedIn && <ControlSidebar />}
        <div className="w-full min-w-0 flex-1">
          <main>
            {isControlPanel && !isLoggedIn ? <LoginScreen onLogin={login} /> : children}
          </main>
        </div>
      </div>
      {!isControlPanel && <Footer />}
      {!isControlPanel && !hasOwnStreamPreview && <LiveStreamWidget />}
    </div>
  )
}

function StatusScreen({ title, text, retry }: { title: string; text: string; retry?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <BrandMark />
      <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="mt-2 max-w-md text-[15px] text-muted-foreground">{text}</p>
      {retry && <button type="button" onClick={() => window.location.reload()} className="btn-pill btn-primary mt-7">Reintentar</button>}
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-muted text-[12px] text-muted-foreground">
      <div className="container-apple py-10">
        <div className="flex flex-col gap-8 border-b border-border pb-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <BrandMark className="text-foreground" />
            <p className="mt-3 leading-relaxed">
              Competencia de robótica y dron de la Institución Educativa Soledad Román de Núñez · 29 de septiembre de 2026. Director del evento: Edil Melo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-14 gap-y-2 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-foreground">Torneo</span>
              <Link href="/categorias" className="hover:underline">Categorías</Link>
              <Link href="/bracket" className="hover:underline">Llaves</Link>
              <Link href="/envivo" className="hover:underline">En vivo</Link>
              <Link href="/reglamento" className="hover:underline">Reglamento</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-foreground">Resultados</span>
              <Link href="/ranking" className="hover:underline">Ranking</Link>
              <Link href="/galeria" className="hover:underline">Galería</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-foreground">Organización</span>
              <Link href="/control" className="hover:underline">Panel de control</Link>
            </div>
          </div>
        </div>
        <p className="pt-6">© {new Date().getFullYear()} Torneo INEDSOR · Robótica escolar.</p>
      </div>
    </footer>
  )
}

function LoginScreen({ onLogin }: { onLogin: (code: string) => Promise<string | null> }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const message = await onLogin(code.trim())
    setBusy(false)
    if (message) {
      setError(message)
      setShakeKey(k => k + 1)
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-height))] items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-[400px] text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-[#2997ff] to-[#6e5bff] text-white shadow-[0_12px_30px_-8px_rgba(41,151,255,.6)]">
          <LockKeyhole size={28} strokeWidth={1.8} />
        </div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Centro de Control</h1>
        <p className="mt-2 text-[17px] text-muted-foreground">Ingresa el código de organizador. Solo se pide una vez en este dispositivo.</p>

        <form onSubmit={handleSubmit} className="mt-9">
          <input type="text" name="username" autoComplete="username" value="organizador" readOnly className="sr-only" tabIndex={-1} aria-hidden="true" />
          <motion.div
            key={shakeKey}
            animate={shakeKey ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
            transition={{ duration: 0.4 }}
            className={`relative flex items-center rounded-[14px] border bg-card transition-[border-color,box-shadow] focus-within:ring-4 ${error ? "border-destructive focus-within:ring-destructive/15" : "border-input focus-within:border-primary focus-within:ring-primary/15"}`}
          >
            <label htmlFor="control-code" className="sr-only">Código de acceso</label>
            <input
              id="control-code"
              type="password"
              autoComplete="current-password"
              placeholder="Código de acceso"
              className="h-[54px] w-full bg-transparent pl-4 pr-14 text-[17px] outline-none"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null) }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!code || busy}
              aria-label="Entrar al panel"
              className="absolute right-2.5 grid h-9 w-9 place-items-center rounded-full border border-input text-foreground/70 transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
            >
              {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground/70" /> : <ArrowRight size={17} />}
            </button>
          </motion.div>
          {error && <p className="mt-3 text-[14px] text-destructive" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  )
}
