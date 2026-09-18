import { Link, useLocation } from "wouter"
import { cn } from "@/components/ui/button"
import { Users, CheckSquare, Swords, Upload, LayoutDashboard, LogOut } from "lucide-react"
import { useData } from "@/lib/data"

export function ControlSidebar() {
  const [location] = useLocation()
  const { logout } = useData()

  const navItems = [
    { href: "/control", label: "RESUMEN", icon: LayoutDashboard },
    { href: "/control/asistencia", label: "ASISTENCIA", icon: CheckSquare },
    { href: "/control/participantes", label: "PARTICIPANTES", icon: Users },
    { href: "/control/competencia", label: "COMPETENCIA", icon: Swords },
    { href: "/control/importar", label: "IMPORTAR", icon: Upload },
  ]

  return (
    <aside className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-foreground bg-muted/20 flex flex-col md:min-h-[calc(100vh-4rem)]">
      <div className="p-4 md:p-6 border-b-2 border-foreground hidden md:block">
        <h2 className="font-serif font-bold text-xl uppercase">Panel de Control</h2>
        <p className="font-mono text-sm text-muted-foreground mt-1">ORGANIZADOR</p>
      </div>
      <nav className="flex flex-row md:flex-col p-2 md:p-4 gap-2 overflow-x-auto flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.href || (item.href !== "/control" && location.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 font-mono font-bold text-xs md:text-sm uppercase transition-colors border-2 whitespace-nowrap",
                isActive 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-transparent border-transparent hover:border-foreground/20 text-foreground/70 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="hidden sm:inline-block">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-2 md:p-4 mt-auto border-t-2 border-foreground hidden md:block">
        <button 
          onClick={logout}
          className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 font-mono font-bold text-xs md:text-sm uppercase transition-colors border-2 bg-transparent border-transparent hover:border-foreground/20 text-foreground/70 hover:text-foreground w-full text-left"
        >
          <LogOut className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
          <span>SALIR</span>
        </button>
      </div>
    </aside>
  )
}
