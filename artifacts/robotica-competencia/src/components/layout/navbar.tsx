import * as React from "react"
import { Link, useLocation } from "wouter"
import { cn } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [location] = useLocation()
  const [isOpen, setIsOpen] = React.useState(false)

  // Close menu when location changes
  React.useEffect(() => {
    setIsOpen(false)
  }, [location])

  const links = [
    { href: "/", label: "INICIO" },
    { href: "/categorias", label: "CATEGORÍAS" },
    { href: "/ranking", label: "RANKING" },
    { href: "/bracket", label: "BRACKETS" },
    { href: "/control", label: "CONTROL (ORG)" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="mr-8 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-serif text-xl font-bold uppercase tracking-tight">C·ROBÓTICA</span>
          </Link>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex flex-1 items-center justify-between space-x-2 text-sm font-mono">
          <div className="flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 font-bold",
                  location === link.href ? "text-foreground border-b-2 border-foreground pb-1" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-foreground">
          <div className="flex flex-col space-y-4 px-4 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-lg font-mono font-bold uppercase",
                  location === link.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
