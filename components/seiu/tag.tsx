"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type SeiuTagTone = "accent" | "chip" | "ok" | "gold"

const TONES: Record<SeiuTagTone, string> = {
  accent: "bg-seiu-accent text-seiu-on-accent",
  chip: "bg-seiu-chip text-seiu-accent-ink",
  ok: "bg-seiu-ok-bg text-seiu-ok-ink",
  gold: "bg-seiu-gold-bg text-seiu-gold-ink",
}

// 每個標籤歪的角度不一樣，像隨手貼上去的。
const TILTS = [-2, 1.5, -1, 2]

export function SeiuTag({
  children,
  tone = "chip",
  tilt = 0,
  onRemove,
  className,
}: {
  children: ReactNode
  tone?: SeiuTagTone
  tilt?: number
  onRemove?: () => void
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-[7px] pl-[17px] pr-[15px] text-sm",
        TONES[tone],
        className
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span className="text-[11px] opacity-70">✦</span>
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="移除"
          onClick={onRemove}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onRemove()
            }
          }}
          className="cursor-pointer rounded-full text-[15px] leading-none opacity-75"
        >
          ×
        </span>
      )}
    </span>
  )
}

/** 一組可以拆掉的標籤，拆完剩一個「加回來」。 */
export function SeiuTagList({
  tags,
  tones = {},
  onChange,
  resetTo,
  className,
}: {
  tags: string[]
  tones?: Record<string, SeiuTagTone>
  onChange: (next: string[]) => void
  resetTo: string[]
  className?: string
}) {
  const reset = () => onChange(resetTo)

  return (
    <div
      className={cn(
        "flex min-h-[38px] flex-wrap items-center gap-3",
        className
      )}
    >
      {tags.map((t, i) => (
        <SeiuTag
          key={t}
          tone={tones[t] ?? "chip"}
          tilt={TILTS[i % TILTS.length]}
          onRemove={() => onChange(tags.filter((x) => x !== t))}
        >
          {t}
        </SeiuTag>
      ))}
      {tags.length < resetTo.length && (
        <span
          role="button"
          tabIndex={0}
          onClick={reset}
          onKeyDown={(e) => e.key === "Enter" && reset()}
          className="cursor-pointer rounded-full border-[1.5px] border-dashed border-seiu-dash px-[17px] py-[7px] text-sm text-seiu-muted"
        >
          ＋ 全部加回來
        </span>
      )}
    </div>
  )
}

/** 狀態徽章，表格右欄那種。 */
export function SeiuBadge({
  children,
  tone = "ok",
  className,
}: {
  children: ReactNode
  tone?: "ok" | "warn" | "err" | "neutral"
  className?: string
}) {
  const tones = {
    ok: "bg-seiu-ok-bg text-seiu-ok-ink",
    warn: "bg-seiu-warn-bg text-seiu-warn-ink",
    err: "bg-seiu-err-bg text-seiu-err-ink",
    neutral: "bg-seiu-field2 text-seiu-label",
  }
  return (
    <span
      className={cn(
        "rounded-full px-[13px] py-[5px] text-[13px]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export function SeiuAvatar({
  gradient = "linear-gradient(160deg,#DCE9F7,#C8EAFF)",
  children,
  className,
}: {
  gradient?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-seiu-surface font-infant text-sm text-seiu-on-panel shadow-[0_0_0_1.5px_var(--seiu-edge-soft),0_4px_10px_var(--seiu-shadow)]",
        className
      )}
      style={{ background: gradient }}
    >
      {children}
    </div>
  )
}

/** 疊在一起的頭像列，最後一顆是深底的 +N。 */
export function SeiuAvatarGroup({
  gradients,
  overflow,
  className,
}: {
  gradients: string[]
  overflow?: number
  className?: string
}) {
  return (
    <div className={cn("flex", className)}>
      {gradients.map((g, i) => (
        <SeiuAvatar
          key={i}
          gradient={g}
          className={i > 0 ? "-ml-3.5" : undefined}
        />
      ))}
      {overflow !== undefined && (
        <div className="seiu-glass-panel -ml-3.5 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-seiu-surface font-infant text-sm text-seiu-on-panel">
          +{overflow}
        </div>
      )}
    </div>
  )
}

/** 名字 + 綠點在線狀態。 */
export function SeiuPresence({
  name,
  status = "在線上",
  className,
}: {
  name: ReactNode
  status?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="text-base">{name}</div>
      <div className="flex items-center gap-[7px] text-[13px] text-seiu-label">
        <span className="block h-2 w-2 rounded-full bg-[#5BB99E]" />
        {status}
      </div>
    </div>
  )
}
