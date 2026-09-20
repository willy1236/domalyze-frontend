"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 毛玻璃卡片。庫裡每一個區塊都是這張卡。 */
export function SeiuCard({
  children,
  className,
  tone = "soft",
}: {
  children: ReactNode
  className?: string
  tone?: "soft" | "surface" | "panel"
}) {
  return (
    <div
      className={cn(
        "rounded-blob-xl p-[38px_40px] shadow-[0_14px_34px_var(--seiu-shadow)]",
        tone === "soft" && "seiu-glass-soft",
        tone === "surface" && "seiu-glass",
        tone === "panel" && "seiu-glass-panel text-seiu-panel-body",
        className
      )}
    >
      {children}
    </div>
  )
}

/** 中文標題壓一道螢光筆，右邊跟一個斜體英文註記。 */
export function SeiuSectionHeading({
  title,
  en,
  className,
}: {
  title: ReactNode
  en?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <span className="seiu-marker text-2xl tracking-[0.1em]">{title}</span>
      {en && (
        <span className="font-infant text-base italic text-seiu-muted">
          {en}
        </span>
      )}
    </div>
  )
}

/** 卡片 + 標題的組合，最常用的外框。 */
export function SeiuSection({
  title,
  en,
  children,
  className,
  headingClassName,
}: {
  title: ReactNode
  en?: ReactNode
  children: ReactNode
  className?: string
  headingClassName?: string
}) {
  return (
    <SeiuCard className={className}>
      <SeiuSectionHeading
        title={title}
        en={en}
        className={cn("mb-[30px]", headingClassName)}
      />
      {children}
    </SeiuCard>
  )
}

/** 左右兩道虛點，中間一顆星。 */
export function SeiuDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="seiu-dotted block h-0.5 flex-1" />
      <span className="text-seiu-muted">✦</span>
      <span className="seiu-dotted block h-0.5 flex-1" />
    </div>
  )
}

/** 色票：歪一點點的方塊配一行名字。 */
export function SeiuSwatch({
  name,
  color,
  tilt = 0,
  outlined = false,
}: {
  name: string
  color: string
  tilt?: number
  outlined?: boolean
}) {
  return (
    <div
      className="flex flex-col items-center gap-[9px]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className="h-[70px] w-[70px] rounded-blob-lg"
        style={{
          background: color,
          boxShadow: outlined ? "inset 0 0 0 1px var(--seiu-dash)" : undefined,
        }}
      />
      <span className="text-[13px] text-seiu-label">{name}</span>
    </div>
  )
}

/** 上面一塊圖、下面兩行說明的卡片。 */
export function SeiuImageCard({
  media,
  title,
  description,
  action,
  className,
}: {
  media?: ReactNode
  title: ReactNode
  description: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "seiu-glass flex flex-col overflow-hidden rounded-blob-xl shadow-[0_14px_34px_var(--seiu-shadow)] transition-[transform,box-shadow] duration-[260ms] hover:-translate-y-[5px] hover:shadow-[0_24px_46px_var(--seiu-shadow2)]",
        className
      )}
    >
      <div className="flex h-[158px] items-center justify-center bg-[linear-gradient(150deg,var(--seiu-lav),var(--seiu-mint))] text-[44px] text-seiu-surface">
        {media ?? "✦"}
      </div>
      <div className="flex flex-col gap-[11px] p-[26px_28px]">
        <div className="text-[19px] tracking-[0.06em]">{title}</div>
        <p className="m-0 text-[15px] font-light leading-[2] text-seiu-body">
          {description}
        </p>
        {action && <div className="mt-1 self-start">{action}</div>}
      </div>
    </div>
  )
}

/** 深底的強調卡片，放在頁面中間需要停一下的地方。 */
export function SeiuPanelCard({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "seiu-glass-panel flex flex-col justify-center gap-[15px] rounded-blob-xl p-8 shadow-[0_14px_34px_var(--seiu-shadow)] transition-[transform,box-shadow] duration-[260ms] hover:-translate-y-[5px] hover:shadow-[0_24px_46px_var(--seiu-shadow2)]",
        className
      )}
    >
      {eyebrow && (
        <div className="text-sm tracking-[0.2em] text-[#C8EAFF]">{eyebrow}</div>
      )}
      <div className="text-[22px] leading-[1.7] tracking-[0.06em] text-seiu-on-panel">
        {title}
      </div>
      <p className="m-0 text-[15px] font-light leading-[2] text-seiu-panel-body">
        {description}
      </p>
    </div>
  )
}

/** 一個大數字、一條進度、一行註解。 */
export function SeiuStatCard({
  title,
  badge,
  value,
  delta,
  progress,
  footnote,
  className,
}: {
  title: ReactNode
  badge?: ReactNode
  value: ReactNode
  delta?: ReactNode
  progress?: number
  footnote?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "seiu-glass flex flex-col gap-[18px] rounded-blob-xl p-8 shadow-[0_14px_34px_var(--seiu-shadow)] transition-[transform,box-shadow] duration-[260ms] hover:-translate-y-[5px] hover:shadow-[0_24px_46px_var(--seiu-shadow2)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[19px] tracking-[0.06em]">{title}</div>
        {badge && (
          <span className="rotate-2 rounded-full bg-seiu-chip px-3.5 py-1.5 text-[13px] text-seiu-accent-ink">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="font-infant text-[54px] leading-[0.95] text-seiu-ink">
          {value}
        </span>
        {delta && <span className="text-sm text-seiu-ok-ink">{delta}</span>}
      </div>
      {progress !== undefined && (
        <div className="h-3 overflow-hidden rounded-full bg-seiu-field2">
          <div
            className="h-full rounded-full bg-seiu-accent"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {footnote && (
        <div className="text-sm font-light text-seiu-label">{footnote}</div>
      )}
    </div>
  )
}

/** 特色卡：上面一個圓圈圖示，右下角藏一團光。 */
export function SeiuFeatureCard({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-blob-lg border border-seiu-edge-soft bg-[linear-gradient(180deg,var(--seiu-chip),transparent_62%)] p-[28px_26px_24px] transition-[transform,box-shadow,border-color] duration-[260ms] hover:-translate-y-1 hover:shadow-[0_0_0_1px_var(--seiu-accent),0_18px_36px_var(--seiu-shadow)]",
        className
      )}
    >
      <div className="mb-[22px] flex h-11 w-11 items-center justify-center rounded-full border border-seiu-accent-ink text-xl text-seiu-accent-ink shadow-[0_0_18px_var(--seiu-shadow2)]">
        {icon}
      </div>
      <div className="mb-3.5 text-lg tracking-[0.06em]">{title}</div>
      <p className="m-0 border-t border-seiu-edge-soft pt-3.5 text-sm font-light leading-[2] text-seiu-body">
        {description}
      </p>
      <div
        className="absolute -bottom-3.5 -right-3.5 h-[72px] w-[72px] rounded-full"
        style={{ background: "var(--seiu-glow2)" }}
      />
    </div>
  )
}

/** 一整排數字，格與格之間只用 1px 的縫。 */
export function SeiuMetricsRow({
  items,
  className,
}: {
  items: { label: ReactNode; value: ReactNode }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-px bg-seiu-dash [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]",
        className
      )}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className="seiu-glass flex flex-col gap-2 border-0 p-[26px_22px]"
        >
          <div className="text-xs tracking-[0.22em] text-seiu-muted">
            {it.label}
          </div>
          <div className="font-infant text-[38px] leading-none text-seiu-accent-ink">
            {it.value}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 每一條前面掛一顆會發光的星。 */
export function SeiuStarredList({
  items,
  className,
}: {
  items: ReactNode[]
  className?: string
}) {
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-[18px] p-0", className)}>
      {items.map((it, i) => (
        <li
          key={i}
          className="flex gap-3.5 text-[15px] font-light leading-[1.9] text-seiu-body"
        >
          <span className="pt-[5px] text-xs text-seiu-accent-ink [text-shadow:0_0_8px_var(--seiu-shadow2)]">
            ✦
          </span>
          {it}
        </li>
      ))}
    </ul>
  )
}

/** 段落開頭的停點：左邊一條紫線，上面一行小標。 */
export function SeiuSideLabel({
  eyebrow,
  title,
  className,
}: {
  eyebrow: ReactNode
  title: ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-l-2 border-seiu-accent pl-5", className)}>
      <div className="mb-2 text-[13px] tracking-[0.24em] text-seiu-label">
        {eyebrow}
      </div>
      <div className="text-xl leading-[1.6] tracking-[0.06em]">{title}</div>
    </div>
  )
}
