import * as React from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/components/ui/button"
import { Menu, X, Home, Layers, Trophy, LayoutTemplate, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [location] = useLocation()
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setIsOpen(false)
  }, [location])

  const links = [
    { href: "/", label: "INICIO", icon: Home, colorClass: "text-tab-home", activeClass: "text-tab-home border-tab-home" },
    { href: "/categorias", label: "CATEGORÍAS", icon: Layers, colorClass: "text-tab-cat", activeClass: "text-tab-cat border-tab-cat" },
    { href: "/ranking", label: "RANKING", icon: Trophy, colorClass: "text-tab-rank", activeClass: "text-tab-rank border-tab-rank" },
    { href: "/bracket", label: "BRACKETS", icon: LayoutTemplate, colorClass: "text-tab-bracket", activeClass: "text-tab-bracket border-tab-bracket" },
    { href: "/control", label: "CONTROL", icon: Settings, colorClass: "text-tab-control", activeClass: "text-tab-control border-tab-control" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-border bg-background shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="hidden md:flex flex-1 items-center justify-center space-x-2 text-sm font-mono">
          <div className="flex items-center space-x-8 h-full">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              const colorBase = link.colorClass.split("-")[2];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 transition-all font-bold border-b-4 py-5",
                    isActive ? link.activeClass : `border-transparent text-muted-foreground hover:text-tab-${colorBase}`
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="tracking-widest">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between md:hidden">
          <div className="font-serif font-black uppercase tracking-tight text-xl">TORNEO INEDSOR</div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="hover:bg-muted">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t-2 border-border">
          <div className="flex flex-col px-2 py-4 bg-muted/10 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              const colorBase = link.colorClass.split("-")[2];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 text-sm font-mono font-bold uppercase p-4 transition-colors border-l-4",
                    isActive ? `text-tab-${colorBase} bg-tab-${colorBase}/10 border-tab-${colorBase}` : `text-muted-foreground border-transparent hover:bg-muted/50 hover:text-tab-${colorBase}`
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="tracking-widest">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
