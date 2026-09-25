import { createElement, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: "div" | "section" | "li" | "article"
}

// Content already on screen when the page opens is shown immediately; only content scrolled into view animates.
export function Reveal({ children, className = "", delay = 0, y = 28, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add("is-visible", "is-instant")
      return
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        el.classList.add("is-visible")
        observer.disconnect()
      }
    }, { rootMargin: "0px 0px -8% 0px" })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style = { "--reveal-y": `${y}px`, "--reveal-delay": `${delay}s` } as CSSProperties
  return createElement(as, { ref, className: `reveal ${className}`, style }, children)
}
