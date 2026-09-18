import { Link, useLocation } from "wouter"
import { cn } from "@/components/ui/button"
import { Users, CheckSquare, Swords, Upload, LayoutDashboard, LogOut, Building2, ChevronLeft, ChevronRight } from "lucide-react"
import { useData } from "@/lib/data"
import { useState } from "react"

export function ControlSidebar() {
  const [location] = useLocation()
  const { logout } = useData()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { href: "/control", label: "RESUMEN", icon: LayoutDashboard },
    { href: "/control/instituciones", label: "INSTITUCIONES", icon: Building2 },
    { href: "/control/asistencia", label: "ASISTENCIA", icon: CheckSquare },
    { href: "/control/participantes", label: "PARTICIPANTES", icon: Users },
    { href: "/control/competencia", label: "COMPETENCIA", icon: Swords },
    { href: "/control/importar", label: "IMPORTAR", icon: Upload },
  ]

  return (
    <aside className={cn(
      "border-b md:border-b-0 md:border-r border-border bg-muted/10 flex flex-col md:min-h-[calc(100vh-4rem)] transition-all duration-300",
      isCollapsed ? "w-full md:w-20" : "w-full md:w-64"
    )}>
      <div className={cn(
        "p-4 border-b border-border hidden md:flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div>
            <h2 className="font-serif font-black text-xl uppercase tracking-tight text-tab-control">Panel</h2>
            <p className="font-mono text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Organizador</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-tab-control/10 hover:text-tab-control rounded transition-colors text-foreground/70"
          title={isCollapsed ? "Expandir panel" : "Colapsar panel"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex flex-row md:flex-col p-2 md:p-3 gap-1 overflow-x-auto flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.href || (item.href !== "/control" && location.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 md:py-3 font-mono font-bold text-xs md:text-sm uppercase transition-colors whitespace-nowrap rounded-none",
                isCollapsed ? "justify-center" : "gap-3",
                isActive 
                  ? "bg-tab-control text-white" 
                  : "bg-transparent text-foreground/70 hover:bg-tab-control/10 hover:text-tab-control"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="hidden sm:inline-block tracking-wide">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 md:p-3 mt-auto border-t border-border hidden md:block">
        <button 
          onClick={logout}
          className={cn(
            "flex items-center px-3 py-3 font-mono font-bold text-sm uppercase transition-colors bg-transparent hover:bg-destructive/10 text-foreground/70 hover:text-destructive w-full rounded-none",
            isCollapsed ? "justify-center" : "gap-3 text-left"
          )}
          title={isCollapsed ? "SALIR" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="tracking-wide">SALIR</span>}
        </button>
      </div>
    </aside>
  )
}
