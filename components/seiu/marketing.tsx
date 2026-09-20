"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { SeiuButton } from "./button"

/** 淺薰衣草底的訂閱區塊，四角各藏一顆星。 */
export function SeiuNewsletter({
  eyebrow = "✦ 每月一封",
  title,
  description,
  placeholder = "you@example.com",
  cta = "訂閱",
  onSubmit,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description: ReactNode
  placeholder?: string
  cta?: ReactNode
  onSubmit?: (email: string) => void
  className?: string
}) {
  const [email, setEmail] = useState("")

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(email)
      }}
      className={cn(
        "relative flex flex-col items-center gap-[18px] overflow-hidden rounded-blob-2xl bg-seiu-lav p-[54px_40px] text-center",
        className
      )}
    >
      <div className="absolute right-[34px] top-[18px] text-[26px] text-seiu-soft">✦</div>
      <div className="absolute bottom-[22px] left-[38px] text-xl text-seiu-soft">✦</div>
      <div className="text-[15px] tracking-[0.2em] text-seiu-ink">{eyebrow}</div>
      <div className="text-[30px] tracking-[0.08em]">{title}</div>
      <p className="m-0 max-w-[32ch] text-[15px] font-light leading-[2] text-seiu-ink">
        {description}
      </p>
      <div className="mt-2 flex w-full max-w-[440px] flex-wrap justify-center gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="seiu-glass min-w-[200px] flex-1 rounded-blob-lg border-0 px-[22px] py-[15px] font-infant text-[17px] text-seiu-ink outline-none"
        />
        <SeiuButton type="submit" size="lg">
          {cta}
        </SeiuButton>
      </div>
    </form>
  )
}

export interface SeiuFooterColumn {
  title: string
  links: string[]
}

/** 深底頁尾。 */
export function SeiuFooter({
  brand,
  tagline,
  columns,
  copyright,
  className,
}: {
  brand: ReactNode
  tagline: ReactNode
  columns: SeiuFooterColumn[]
  copyright: ReactNode
  className?: string
}) {
  return (
    <footer
      className={cn(
        "seiu-glass-panel rounded-blob-2xl p-[48px_40px_36px] text-seiu-panel-body",
        className
      )}
    >
      <div className="grid gap-8 border-b border-[rgba(184,205,233,.26)] pb-[30px] [grid-template-columns:repeat(auto-fit,minmax(176px,1fr))]">
        <div className="flex flex-col gap-[13px]">
          <div className="text-xl tracking-[0.18em] text-seiu-on-panel">
            {brand}
          </div>
          <p className="m-0 text-sm font-light leading-[2.1]">{tagline}</p>
        </div>
        {columns.map((col) => (
          <div
            key={col.title}
            className="flex flex-col gap-2.5 text-sm font-light"
          >
            <div className="mb-1 text-[13px] tracking-[0.16em] text-seiu-panel-muted">
              {col.title}
            </div>
            {col.links.map((l) => (
              <span key={l} className="cursor-pointer">
                {l}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="pt-6 font-infant text-sm tracking-[0.14em] text-seiu-panel-muted">
        {copyright}
      </div>
    </footer>
  )
}
