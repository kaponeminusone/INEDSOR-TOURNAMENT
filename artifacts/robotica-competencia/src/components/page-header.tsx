import type { ReactNode } from "react"
import { Reveal } from "@/components/reveal"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function ControlHeader({ title, description, actions }: Omit<PageHeaderProps, "eyebrow">) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] md:text-[34px]">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="container-apple pt-14 pb-10 md:pt-20 md:pb-14">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
          <h1 className="headline-xl">{title}</h1>
          {description && <p className="lead mt-4">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </Reveal>
    </header>
  )
}
