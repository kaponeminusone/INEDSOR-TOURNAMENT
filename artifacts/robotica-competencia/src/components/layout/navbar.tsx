import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useLocation } from "wouter"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronRight, Lock } from "lucide-react"

const links = [
  { href: "/", label: "Inicio" },
  { href: "/categorias", label: "Categorías" },
  { href: "/ranking", label: "Ranking" },
  { href: "/bracket", label: "Llaves" },
  { href: "/envivo", label: "En vivo" },
  { href: "/galeria", label: "Galería" },
  { href: "/reglamento", label: "Reglamento" },
]

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-[26px] w-[26px] place-items-center rounded-[8px] bg-foreground text-[14px] font-bold text-background">
        I
        <span className="absolute bottom-[5px] right-[5px] h-[4px] w-[4px] rounded-full bg-brand-red" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em]">INEDSOR</span>
    </span>
  )
}

export function Navbar() {
  const [location] = useLocation()
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => setOpen(false), [location])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const isActive = (href: string) => href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`)
  const controlActive = location.startsWith("/control")

  return (
    <nav className="nav-glass" aria-label="Navegación principal">
      <div className="container-wide flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="Torneo INEDSOR, inicio" className="shrink-0">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-7 md:flex lg:gap-9">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="nav-link" aria-current={isActive(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/control"
            className={`hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors md:inline-flex ${controlActive ? "bg-foreground text-background" : "bg-muted text-foreground/80 hover:text-foreground"}`}
            aria-current={controlActive ? "page" : undefined}
          >
            <Lock size={12} strokeWidth={2.4} /> Control
          </Link>
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center md:hidden"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen(value => !value)}
          >
            <span className={`absolute h-[1.5px] w-[17px] rounded bg-foreground transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
            <span className={`absolute h-[1.5px] w-[17px] rounded bg-foreground transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
          </button>
        </div>
      </div>

      {createPortal(<AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-[var(--nav-height)] z-50 bg-background md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            <div className="container-wide pt-6">
              {[...links, { href: "/control", label: "Control" }].map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={reduce ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.04 * i + 0.05, duration: 0.35, ease: [0.28, 0.11, 0.32, 1] }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center justify-between border-b border-border/70 py-4 text-[28px] font-semibold tracking-[-0.03em]"
                    aria-current={(link.href === "/control" ? controlActive : isActive(link.href)) ? "page" : undefined}
                  >
                    {link.label}
                    <ChevronRight className="text-muted-foreground" size={22} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </nav>
  )
}
