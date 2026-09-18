import { ReactNode, useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ControlSidebar } from "@/components/layout/control-sidebar"
import { useLocation } from "wouter"
import { useData } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const { isLoggedIn, login } = useData()
  const isControlPanel = location.startsWith("/control")

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background overflow-x-hidden">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row relative">
        {isControlPanel && isLoggedIn && <ControlSidebar />}
        <AnimatePresence mode="wait">
          <motion.main 
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 w-full relative"
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
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-muted/10">
      <div className="border-4 border-tab-control bg-card p-8 max-w-md w-full shadow-[8px_8px_0px_0px_var(--color-tab-control)]">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-tab-control text-background rounded-none">
            <ShieldAlert className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-black uppercase text-center mb-2 text-tab-control">Acceso Restringido</h1>
        <p className="text-center font-mono text-muted-foreground mb-8 text-sm">
          Área exclusiva para organizadores.<br/>(Para esta demo usa: <strong className="text-foreground">ROBOT2026</strong>)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              type="password"
              autoComplete="current-password"
              placeholder="Código de acceso"
              className="text-center text-xl h-14 uppercase rounded-none border-2 border-border focus-visible:border-tab-control focus-visible:ring-0"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
            />
            {error && <p className="text-destructive font-mono text-xs mt-2 text-center font-bold">Código incorrecto.</p>}
          </div>
          <Button type="submit" className="w-full h-14 text-lg rounded-none bg-tab-control hover:bg-tab-control/90 text-white font-bold tracking-widest">ENTRAR AL PANEL</Button>
        </form>
        
        <p className="text-center font-mono text-xs text-muted-foreground mt-6 opacity-70">
          En producción la validación se realiza en servidor.
        </p>
      </div>
    </div>
  )
}
