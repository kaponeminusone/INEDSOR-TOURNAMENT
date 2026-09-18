import { ReactNode, useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ControlSidebar } from "@/components/layout/control-sidebar"
import { useLocation } from "wouter"
import { useData } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const { isLoggedIn, login } = useData()
  const isControlPanel = location.startsWith("/control")

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background">
      <Navbar />
      <div className="flex flex-1 flex-col md:flex-row">
        {isControlPanel && isLoggedIn && <ControlSidebar />}
        <main className="flex-1 w-full relative">
          {isControlPanel && !isLoggedIn ? (
            <LoginScreen onLogin={login} />
          ) : (
            children
          )}
        </main>
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
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="border-4 border-foreground bg-card p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex justify-center mb-6">
          <ShieldAlert className="h-16 w-16" />
        </div>
        <h1 className="text-3xl font-serif font-black uppercase text-center mb-2">Acceso Restringido</h1>
        <p className="text-center font-mono text-muted-foreground mb-8">
          Área exclusiva para organizadores. (Para esta demo usa: <strong>ROBOT2026</strong>)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              type="password"
              autoComplete="current-password"
              placeholder="Código de acceso"
              className="text-center text-xl h-14 uppercase"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
            />
            {error && <p className="text-destructive font-mono text-xs mt-2 text-center font-bold">Código incorrecto.</p>}
          </div>
          <Button type="submit" className="w-full h-14 text-lg">ENTRAR AL PANEL</Button>
        </form>
        
        <p className="text-center font-mono text-xs text-muted-foreground mt-6 opacity-70">
          En producción la validación se realiza en servidor.
        </p>
      </div>
    </div>
  )
}
