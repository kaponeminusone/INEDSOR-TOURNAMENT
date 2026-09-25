import { ReactNode, useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ControlSidebar } from "@/components/layout/control-sidebar"
import { useLocation } from "wouter"
import { useData } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion"

function getRouteIndex(path: string) {
  if (path === "/") return 0
  if (path.startsWith("/categorias")) return 1
  if (path.startsWith("/ranking")) return 2
  if (path.startsWith("/bracket")) return 3
  if (path.startsWith("/galeria")) return 4
  if (path.startsWith("/control")) return 5
  return 0
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const { isLoggedIn, login } = useData()
  const isControlPanel = location.startsWith("/control")
  const shouldReduceMotion = useReducedMotion()

  const currentIndex = getRouteIndex(location)
  const prevIndexRef = useRef(currentIndex)
  const prevLocationRef = useRef(location)
  
  const involvesControl =
    location.startsWith("/control") || prevLocationRef.current.startsWith("/control")
  const direction = involvesControl
    ? 0
    : currentIndex > prevIndexRef.current
      ? 1
      : currentIndex < prevIndexRef.current
        ? -1
        : 0
  
  useEffect(() => {
    prevIndexRef.current = currentIndex
    prevLocationRef.current = location
  }, [currentIndex, location])

  const variants: Variants = {
    initial: (dir: number) => ({
      x: shouldReduceMotion ? 0 : (dir > 0 ? "100%" : dir < 0 ? "-100%" : 0),
    }),
    animate: (dir: number) => ({
      x: 0,
      transition: {
        x: { type: "tween", duration: dir === 0 ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }
      }
    }),
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : (dir > 0 ? "-100%" : dir < 0 ? "100%" : 0),
      transition: {
        x: { type: "tween", duration: dir === 0 ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }
      }
    })
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row relative">
        {isControlPanel && isLoggedIn && <ControlSidebar />}
        <div className="flex-1 min-w-0 w-full grid grid-cols-1 grid-rows-1 overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.main 
              key={location}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`col-start-1 row-start-1 w-full pb-12 ${isControlPanel ? "control-workspace" : ""}`}
            >
              {isControlPanel && !isLoggedIn ? (
                <LoginScreen onLogin={login} />
              ) : (
                children
              )}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (code: string) => boolean }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!onLogin(code)) {
      setError(true)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center p-5">
      <div className="bg-card border border-border rounded-xl max-w-[440px] w-full overflow-hidden shadow-[0_18px_48px_hsl(218_31%_17%_/_0.07)]">
        <div className="h-1 bg-gradient-to-r from-[#28528a] via-[#28528a] to-[#a7494a]" />
        <div className="p-7 sm:p-9">
          <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary grid place-items-center mb-7"><ShieldAlert size={22} strokeWidth={1.8} /></div>
          <span className="eyebrow">ÁREA DE ORGANIZACIÓN</span>
          <h1 className="text-[27px] font-bold mt-2 mb-2">Acceso a Control</h1>
          <p className="text-muted-foreground text-[13px] leading-relaxed mb-7">Gestiona la asistencia, los encuentros y los resultados desde un solo lugar.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="username" autoComplete="username" value="organizador" readOnly className="sr-only" tabIndex={-1} aria-hidden="true" />
            <div>
              <label htmlFor="control-code" className="block text-xs font-semibold mb-2">Código de acceso</label>
              <Input id="control-code" type="password" autoComplete="current-password" placeholder="Introduce tu código" className="h-10 rounded-md" value={code} onChange={(e) => { setCode(e.target.value); setError(false); }} />
              {error && <p className="text-destructive text-xs mt-2" role="alert">Código incorrecto. Compruébalo e inténtalo de nuevo.</p>}
            </div>
            <Button type="submit" className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs">Entrar al panel</Button>
          </form>
          <div className="mt-7 pt-5 border-t border-border text-[11px] text-muted-foreground">Acceso demo: <strong className="text-foreground font-semibold">ROBOT2026</strong></div>
        </div>
      </div>
    </div>
  )
}
