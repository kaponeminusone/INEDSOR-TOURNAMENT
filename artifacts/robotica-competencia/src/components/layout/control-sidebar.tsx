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
      "control-sidebar border-b md:border-b-0 md:border-r border-border flex flex-col md:min-h-[calc(100dvh-64px)] transition-[width] duration-300 shrink-0",
      isCollapsed ? "w-full md:w-[70px]" : "w-full md:w-[218px]"
    )}>
      <div className={cn(
        "px-4 h-[75px] border-b border-border hidden md:flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div>
            <h2 className="font-serif font-bold text-[14px] tracking-tight">Centro de Control</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">TORNEO INEDSOR</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-md transition-colors text-foreground/70"
          aria-label={isCollapsed ? "Expandir panel" : "Colapsar panel"}
          title={isCollapsed ? "Expandir panel" : "Colapsar panel"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex flex-row md:flex-col p-2 md:p-3 gap-0.5 overflow-x-auto flex-1" aria-label="Secciones de Control">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.href || (item.href !== "/control" && location.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                 "flex items-center px-3 py-2.5 text-[11px] font-semibold transition-colors whitespace-nowrap",
                isCollapsed ? "justify-center" : "gap-3",
                isActive 
                   ? "bg-primary text-primary-foreground" 
                   : "bg-transparent text-foreground/70 hover:bg-primary/10 hover:text-primary"
              )}
               data-active={isActive}
              title={isCollapsed ? item.label : undefined}
            >
               <Icon className="h-[17px] w-[17px] shrink-0" />
               <span className={cn("tracking-[.025em]", isCollapsed ? "md:hidden" : "")}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <button onClick={logout} className="md:hidden flex items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground border-t border-border"><LogOut size={15} /> Cerrar sesión</button>
      <div className="p-2 md:p-3 mt-auto border-t border-border hidden md:block">
        <button 
          onClick={logout}
          className={cn(
             "flex items-center px-3 py-2.5 font-semibold text-[11px] transition-colors bg-transparent hover:bg-destructive/10 text-foreground/70 hover:text-destructive w-full rounded-md",
            isCollapsed ? "justify-center" : "gap-3 text-left"
          )}
          title={isCollapsed ? "SALIR" : undefined}
        >
           <LogOut className="h-[17px] w-[17px] shrink-0" />
           {!isCollapsed && <span className="tracking-wide">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
