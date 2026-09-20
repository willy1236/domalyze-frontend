"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { SeiuButton } from "./button"

export type SeiuAlertTone = "info" | "ok" | "warn" | "err"

const ALERT_TONES: Record<SeiuAlertTone, { box: string; icon: string }> = {
  info: { box: "bg-seiu-field2 text-seiu-body", icon: "text-seiu-accent-ink" },
  ok: { box: "bg-seiu-ok-bg text-seiu-ok-ink", icon: "text-seiu-ok-ink" },
  warn: { box: "bg-seiu-warn-bg text-seiu-warn-ink", icon: "text-seiu-warn-ink" },
  err: { box: "bg-seiu-err-bg text-seiu-err-ink", icon: "text-seiu-err-ink" },
}

const ALERT_GLYPH: Record<SeiuAlertTone, string> = {
  info: "✦",
  ok: "✦",
  warn: "！",
  err: "×",
}

export function SeiuAlert({
  tone = "info",
  children,
  className,
}: {
  tone?: SeiuAlertTone
  children: ReactNode
  className?: string
}) {
  const t = ALERT_TONES[tone]
  return (
    <div
      className={cn(
        "flex gap-3.5 rounded-blob-md p-[16px_20px]",
        t.box,
        className
      )}
    >
      <span className={t.icon}>{ALERT_GLYPH[tone]}</span>
      <div className="text-[15px] leading-[1.9]">{children}</div>
    </div>
  )
}

export function SeiuSpinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="載入中"
      className={cn(
        "h-[30px] w-[30px] animate-[seiu-spin_.95s_linear_infinite] rounded-full border-4 border-seiu-field2 border-t-seiu-accent-ink",
        className
      )}
    />
  )
}

/** 一條漸層進度。 */
export function SeiuProgress({
  label,
  hint,
  value,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  value: number
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {(label || hint) && (
        <div className="flex justify-between text-sm text-seiu-label">
          <span>{label}</span>
          <span>{hint}</span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-seiu-field2">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--seiu-accent),var(--seiu-mint))]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

/** 用月亮數數的離散進度；剛好卡在中間那顆畫成半滿。 */
export function SeiuMoonProgress({
  total = 8,
  filled,
  className,
}: {
  total?: number
  filled: number
  className?: string
}) {
  return (
    <div className={cn("flex gap-2.5", className)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-[26px] w-[26px] rounded-full"
          style={{
            background:
              i < Math.floor(filled)
                ? "var(--seiu-accent)"
                : i === Math.floor(filled) && filled % 1 !== 0
                  ? "linear-gradient(90deg,var(--seiu-accent) 50%,var(--seiu-field2) 50%)"
                  : "var(--seiu-field2)",
          }}
        />
      ))}
    </div>
  )
}

/** 一顆圓 + 兩條線的骨架，底色會流過去。 */
export function SeiuSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <div className="seiu-shimmer h-[46px] w-[46px] shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-[9px]">
        <div className="seiu-shimmer h-[13px] w-[72%] rounded-lg" />
        <div className="seiu-shimmer h-[13px] w-[45%] rounded-lg" />
      </div>
    </div>
  )
}

export function SeiuEmptyState({
  icon = "✦",
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3.5 p-[14px_0_6px] text-center",
        className
      )}
    >
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-seiu-field text-[40px] text-seiu-label">
        {icon}
      </div>
      <div className="text-lg">{title}</div>
      <p className="m-0 max-w-[26ch] text-[15px] font-light leading-[2] text-seiu-body">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/** 置中對話框。點遮罩或按 Esc 關掉。 */
export function SeiuModal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  eyebrow?: ReactNode
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(6,18,38,.55)] p-6 backdrop-blur-[4px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="seiu-glass w-full max-w-[430px] animate-seiu-rise rounded-[34px_34px_34px_12px] p-[38px] shadow-[0_30px_60px_rgba(6,18,38,.4)]"
      >
        {eyebrow && (
          <div className="mb-3.5 text-[15px] tracking-[0.18em] text-seiu-label">
            {eyebrow}
          </div>
        )}
        <div className="mb-3.5 text-[23px] tracking-[0.06em]">{title}</div>
        <div className="mb-7 text-base font-light leading-[2.1] text-seiu-body">
          {children}
        </div>
        <div className="flex justify-end gap-3">
          {footer ?? (
            <SeiuButton size="sm" onClick={onClose}>
              好
            </SeiuButton>
          )}
        </div>
      </div>
    </div>
  )
}

/** 右下角的深底通知。 */
export function SeiuToast({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      role="status"
      className="seiu-glass-panel fixed bottom-7 right-7 z-[60] flex animate-seiu-rise items-center gap-3 rounded-blob-md p-[16px_24px] text-seiu-on-panel shadow-[0_18px_40px_rgba(6,18,38,.45)]"
    >
      <span className="text-[#C8EAFF]">✦</span>
      <span className="text-[15px]">{children}</span>
    </div>
  )
}

/** 顯示一段時間後自己收掉的通知。 */
export function useSeiuToast(duration = 2600) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const fire = useCallback(() => {
    setOpen(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), duration)
  }, [duration])

  return { open, fire }
}

/** 滑過才出現的提示，錨在觸發元素正上方。 */
export function SeiuTooltip({
  content,
  children,
  className,
}: {
  content: ReactNode
  children: ReactNode
  className?: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
      onFocus={() => setShown(true)}
      onBlur={() => setShown(false)}
      className={cn("relative inline-flex", className)}
    >
      {children}
      <div
        role="tooltip"
        className={cn(
          "seiu-glass-panel pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-blob-sm p-[10px_16px] text-sm text-seiu-on-panel shadow-[0_10px_22px_var(--seiu-shadow2)] transition-opacity duration-200",
          shown ? "opacity-100" : "opacity-0"
        )}
      >
        {content}
      </div>
    </div>
  )
}
