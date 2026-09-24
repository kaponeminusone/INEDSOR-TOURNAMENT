import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, Layers, Trophy, LayoutTemplate, Images, Settings } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: Home, accent: "var(--color-tab-home)" },
  { href: "/categorias", label: "Categorías", icon: Layers, accent: "var(--color-tab-cat)" },
  { href: "/ranking", label: "Ranking", icon: Trophy, accent: "var(--color-tab-rank)" },
  { href: "/bracket", label: "Brackets", icon: LayoutTemplate, accent: "var(--color-tab-bracket)" },
  { href: "/galeria", label: "Galería", icon: Images, accent: "var(--color-tab-home)" },
  { href: "/control", label: "Control", icon: Settings, accent: "var(--color-tab-control)" },
];

export function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location]);
  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(`${href}/`));

  return <nav className="inedsor-nav" aria-label="Navegación principal">
    <div className="inedsor-nav-inner">
      <Link href="/" className="inedsor-brand" aria-label="Torneo INEDSOR, inicio"><span className="inedsor-brand-symbol">I<span>.</span></span><span className="inedsor-brand-name">TORNEO <strong>INEDSOR</strong><small>ROBÓTICA ESCOLAR</small></span></Link>
      <div className="inedsor-nav-links">{links.map(link => <Link key={link.href} href={link.href} style={{ "--nav-accent": link.accent } as React.CSSProperties} className={`inedsor-nav-link${isActive(link.href) ? " active" : ""}`} aria-current={isActive(link.href) ? "page" : undefined}><link.icon size={15} />{link.label}</Link>)}</div>
      <button className="inedsor-nav-toggle" type="button" aria-expanded={open} aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(value => !value)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    </div>
    {open && <div className="inedsor-nav-mobile">{links.map(link => <Link key={link.href} href={link.href} style={{ "--nav-accent": link.accent } as React.CSSProperties} className={`inedsor-nav-mobile-link${isActive(link.href) ? " active" : ""}`} aria-current={isActive(link.href) ? "page" : undefined}><link.icon size={16} />{link.label}</Link>)}</div>}
  </nav>;
}