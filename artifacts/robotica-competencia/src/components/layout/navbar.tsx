import * as React from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/components/ui/button"
import { Menu, X, Home, Layers, Trophy, LayoutTemplate, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [location] = useLocation()
  const [isOpen, setIsOpen] = React.useState(false)

  // Close menu when location changes
  React.useEffect(() => {
    setIsOpen(false)
  }, [location])

  const links = [
    { href: "/", label: "INICIO", icon: Home, colorClass: "hover:text-tab-home", activeClass: "text-tab-home border-tab-home" },
    { href: "/categorias", label: "CATEGORÍAS", icon: Layers, colorClass: "hover:text-tab-cat", activeClass: "text-tab-cat border-tab-cat" },
    { href: "/ranking", label: "RANKING", icon: Trophy, colorClass: "hover:text-tab-rank", activeClass: "text-tab-rank border-tab-rank" },
    { href: "/bracket", label: "BRACKETS", icon: LayoutTemplate, colorClass: "hover:text-tab-bracket", activeClass: "text-tab-bracket border-tab-bracket" },
    { href: "/control", label: "CONTROL", icon: Settings, colorClass: "hover:text-tab-control", activeClass: "text-tab-control border-tab-control" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Desktop Nav */}
        <div className="hidden md:flex flex-1 items-center justify-center space-x-2 text-sm font-mono">
          <div className="flex items-center space-x-8">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 transition-colors font-bold border-b-2 py-5",
                    isActive ? link.activeClass : cn("border-transparent text-muted-foreground", link.colorClass)
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Mobile Nav Top Bar */}
        <div className="flex flex-1 items-center justify-between md:hidden">
          <div className="font-serif font-bold uppercase tracking-tight">TORNEO INEDSOR</div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-border">
          <div className="flex flex-col space-y-2 px-4 py-4 bg-muted/30">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 text-sm font-mono font-bold uppercase p-3",
                    isActive ? link.activeClass.replace("border-", "bg-muted border-l-4 border-l-") : cn("text-muted-foreground", link.colorClass)
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
