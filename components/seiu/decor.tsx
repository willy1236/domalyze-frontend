"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 卡片底下那層被圓形遮罩切掉邊緣的方格。 */
export function SeiuGridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage:
          "linear-gradient(var(--seiu-edge-soft) 1px,transparent 1px),linear-gradient(90deg,var(--seiu-edge-soft) 1px,transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage:
          "radial-gradient(circle at 60% 55%,black,transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(circle at 60% 55%,black,transparent 78%)",
      }}
    />
  )
}

/** 右下角那個只有描邊的大寫字母。 */
export function SeiuMonogram({
  letter = "S",
  className,
}: {
  letter?: string
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-1.5 right-[18px] select-none font-infant text-[130px] italic leading-none opacity-50",
        className
      )}
      style={{
        color: "transparent",
        WebkitTextStroke: "1px var(--seiu-dash)",
      }}
    >
      {letter}
    </div>
  )
}

/**
 * 立繪框：上圓下方的長形框，背後墊一層模糊的毛玻璃。
 * 不帶圖，由呼叫端把 <Image> 之類的內容放進 children；沒給就顯示佔位。
 */
export function SeiuPortraitFrame({
  children,
  note,
  badge = "☾",
  className,
}: {
  children?: ReactNode
  note?: ReactNode
  badge?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative w-[236px]", className)}>
      <div className="seiu-glass-soft absolute -inset-x-2.5 -inset-y-3.5 rounded-[120px_120px_60px_60px] blur-[2px]" />
      <div className="relative aspect-[1/2.1] overflow-hidden rounded-[118px_118px_30px_30px] bg-seiu-lav shadow-[0_22px_46px_var(--seiu-shadow2)]">
        {children ?? (
          <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(135deg,var(--seiu-field)_0_10px,var(--seiu-field2)_10px_20px)]">
            <span className="rounded-full bg-seiu-surface px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] text-seiu-muted">
              PORTRAIT
            </span>
          </div>
        )}
      </div>
      {badge && (
        <div className="absolute -top-3.5 right-[-4px] animate-seiu-float text-[30px] text-seiu-gold">
          {badge}
        </div>
      )}
      {note && (
        <div className="seiu-glass absolute -left-[30px] bottom-14 -rotate-[5deg] rounded-blob-sm p-[9px_16px] text-sm text-seiu-body shadow-[0_8px_18px_var(--seiu-shadow)]">
          {note}
        </div>
      )}
    </div>
  )
}

const ring = "absolute rounded-full"

/**
 * 星盤裝飾框：同心圓、刻度、兩個旋轉的軌道點，中間可以放插圖或截圖。
 * 純裝飾，對輔助技術隱藏。
 */
export function SeiuAstrolabeFrame({
  caption,
  subCaption,
  children,
  className,
}: {
  caption?: ReactNode
  subCaption?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex h-[246px] min-w-[246px] items-center justify-center",
        className
      )}
    >
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        {/* 最外圈細刻度，兩分鐘轉一圈 */}
        <div
          className="absolute h-[228px] w-[228px] animate-[seiu-spin_120s_linear_infinite]"
          style={{
            background:
              "repeating-conic-gradient(var(--seiu-dash) 0deg,var(--seiu-dash) .4deg,transparent .4deg,transparent 6deg)",
            maskImage:
              "radial-gradient(transparent 47%,black 48%,black 50%,transparent 51%)",
            WebkitMaskImage:
              "radial-gradient(transparent 47%,black 48%,black 50%,transparent 51%)",
          }}
        />
        <div className={cn(ring, "h-[206px] w-[206px] border border-seiu-dash")} />
        <div
          className="absolute h-[188px] w-[188px] opacity-75"
          style={{
            background:
              "repeating-conic-gradient(var(--seiu-accent) 0deg,var(--seiu-accent) .8deg,transparent .8deg,transparent 30deg)",
            maskImage:
              "radial-gradient(transparent 44%,black 45%,black 50%,transparent 51%)",
            WebkitMaskImage:
              "radial-gradient(transparent 44%,black 45%,black 50%,transparent 51%)",
          }}
        />
        <div
          className={cn(
            ring,
            "h-[166px] w-[166px] animate-[seiu-spin_46s_linear_infinite] border border-dashed border-seiu-dash"
          )}
        />
        <div
          className={cn(ring, "h-[124px] w-[124px] border border-seiu-edge-soft")}
          style={{
            background: "radial-gradient(circle,var(--seiu-glow2),transparent 72%)",
          }}
        />
        {/* 十字準線 */}
        <div className="absolute h-[206px] w-px bg-[linear-gradient(transparent,var(--seiu-dash)_16%,var(--seiu-dash)_84%,transparent)]" />
        <div className="absolute h-px w-[206px] bg-[linear-gradient(90deg,transparent,var(--seiu-dash)_16%,var(--seiu-dash)_84%,transparent)]" />
        {/* 方與菱 */}
        <div className="absolute h-[98px] w-[98px] rotate-45 border border-seiu-accent-ink" />
        <div className="absolute h-[98px] w-[98px] border border-seiu-lav" />
        <div className="absolute h-11 w-11 rotate-45 border border-seiu-accent" />
        <div className="absolute h-[7px] w-[7px] rounded-full bg-seiu-accent-ink shadow-[0_0_12px_var(--seiu-shadow2)]" />
        {/* 兩顆反向繞行的星 */}
        <div className="absolute h-[206px] w-[206px] animate-[seiu-orbit_22s_linear_infinite]">
          <div className="absolute -top-1 left-1/2 -ml-1 h-2 w-2 rounded-full bg-seiu-mint shadow-[0_0_14px_var(--seiu-mint)]" />
        </div>
        <div className="absolute h-[166px] w-[166px] animate-[seiu-spin-rev_34s_linear_infinite]">
          <div className="absolute -bottom-[3px] left-1/2 -ml-[3px] h-1.5 w-1.5 rounded-full bg-seiu-accent" />
        </div>
        <div className="absolute left-[24%] top-3 text-[11px] text-seiu-label opacity-75">✦</div>
        <div className="absolute right-[11%] top-[28%] text-[9px] text-seiu-label opacity-55">✧</div>
      </div>

      {children}

      {caption && (
        <div className="absolute bottom-0 left-0 border-l border-seiu-accent p-[6px_12px] text-xs tracking-[0.22em] text-seiu-label">
          {caption}
          {subCaption && (
            <div className="mt-1 text-base tracking-[0.04em] text-seiu-ink">
              {subCaption}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
