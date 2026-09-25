import { Link, useLocation } from "wouter"
import { cn } from "@/components/ui/button"
import { Users, CheckSquare, Swords, Upload, LayoutDashboard, LogOut, Building2, PanelLeftClose, PanelLeftOpen, Radio } from "lucide-react"
import { useData } from "@/lib/data"
import { useState } from "react"

const navItems = [
  { href: "/control", label: "Resumen", icon: LayoutDashboard },
  { href: "/control/instituciones", label: "Instituciones", icon: Building2 },
  { href: "/control/asistencia", label: "Asistencia", icon: CheckSquare },
  { href: "/control/participantes", label: "Participantes", icon: Users },
  { href: "/control/competencia", label: "Competencia", icon: Swords },
  { href: "/control/streaming", label: "Streaming", icon: Radio },
  { href: "/control/importar", label: "Importar", icon: Upload },
]

export function ControlSidebar() {
  const [location] = useLocation()
  const { logout } = useData()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "shrink-0 border-b border-border bg-[hsl(240_9%_97%/0.85)] backdrop-blur-xl md:sticky md:top-[var(--nav-height)] md:h-[calc(100dvh-var(--nav-height))] md:border-b-0 md:border-r",
        "transition-[width] duration-300 ease-[cubic-bezier(.28,.11,.32,1)]",
        collapsed ? "md:w-[68px]" : "md:w-[232px]"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("hidden items-center px-4 pb-2 pt-5 md:flex", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Centro de control</span>}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            aria-label={collapsed ? "Expandir panel" : "Colapsar panel"}
            title={collapsed ? "Expandir panel" : "Colapsar panel"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="flex flex-1 gap-1 overflow-x-auto p-2.5 [scrollbar-width:none] md:flex-col md:overflow-visible md:px-3" aria-label="Secciones de control">
          {navItems.map(item => {
            const Icon = item.icon
            const active = location === item.href || (item.href !== "/control" && location.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] font-medium tracking-[-0.01em] transition-colors",
                  collapsed && "md:justify-center md:px-0",
                  active
                    ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,.08),0_0_0_1px_rgba(0,0,0,.03)]"
                    : "text-foreground/70 hover:bg-black/[.045] hover:text-foreground"
                )}
              >
                <Icon size={17} strokeWidth={1.9} className={active ? "text-primary" : ""} />
                <span className={cn(collapsed && "md:hidden")}>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={logout}
            className="flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] font-medium text-foreground/70 hover:bg-destructive/10 hover:text-destructive md:hidden"
          >
            <LogOut size={17} strokeWidth={1.9} /> Salir
          </button>
        </nav>

        <div className="hidden border-t border-border p-3 md:block">
          <button
            onClick={logout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut size={17} strokeWidth={1.9} />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </div>
    </aside>
  )
}
