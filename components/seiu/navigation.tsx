"use client"

import { Fragment, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 深底的膠囊導覽列。 */
export function SeiuNavbar({
  brand,
  items,
  active,
  onSelect,
  action,
  className,
}: {
  brand: ReactNode
  items: string[]
  active?: string
  onSelect?: (item: string) => void
  action?: ReactNode
  className?: string
}) {
  return (
    <nav
      className={cn(
        "seiu-glass-panel flex flex-wrap items-center justify-between gap-5 rounded-[26px] p-[15px_26px]",
        className
      )}
    >
      <div className="flex items-center gap-2.5 text-xl tracking-[0.18em] text-seiu-on-panel">
        {brand}
      </div>
      <div className="flex flex-wrap items-center gap-[26px] text-[15px] text-seiu-panel-body">
        {items.map((it) => (
          <span
            key={it}
            role="link"
            tabIndex={0}
            onClick={() => onSelect?.(it)}
            onKeyDown={(e) => e.key === "Enter" && onSelect?.(it)}
            className={cn(
              "cursor-pointer transition-colors duration-200",
              it === active ? "text-[#C8EAFF]" : "hover:text-[#FCFDFF]"
            )}
          >
            {it}
          </span>
        ))}
        {action}
      </div>
    </nav>
  )
}

/** 麵包屑，分隔符是星。最後一節是當前頁。 */
export function SeiuBreadcrumb({
  items,
  className,
}: {
  items: string[]
  className?: string
}) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center gap-2.5 text-sm text-seiu-label", className)}
    >
      {items.map((it, i) => (
        <Fragment key={it}>
          {i > 0 && <span className="text-seiu-muted">✦</span>}
          <span
            className={cn(
              i === items.length - 1 ? "text-seiu-ink" : "cursor-pointer"
            )}
          >
            {it}
          </span>
        </Fragment>
      ))}
    </nav>
  )
}

/** 分頁標籤：選中的那顆改成不對稱圓角、浮起來。 */
export function SeiuTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: string[]
  active: number
  onChange: (index: number) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-2.5", className)}>
      {tabs.map((t, i) => {
        const on = active === i
        return (
          <div
            key={t}
            role="tab"
            tabIndex={0}
            aria-selected={on}
            onClick={() => onChange(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onChange(i)
              }
            }}
            className={cn(
              "cursor-pointer p-[11px_26px] text-base tracking-[0.08em] transition-all duration-200",
              on
                ? "rounded-[20px_20px_20px_6px] bg-seiu-accent text-seiu-on-accent shadow-[0_8px_18px_var(--seiu-shadow2)]"
                : "rounded-full bg-seiu-field2 text-seiu-label"
            )}
          >
            {t}
          </div>
        )
      })}
    </div>
  )
}

/** 頁碼：非當前頁是圓的，當前頁收成不對稱方角。 */
export function SeiuPagination({
  page,
  total,
  onChange,
  className,
}: {
  page: number
  total: number
  onChange: (next: number) => void
  className?: string
}) {
  const arrow =
    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-seiu-field2 text-[15px] text-seiu-label"

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="上一頁"
        onClick={() => onChange(Math.max(1, page - 1))}
        onKeyDown={(e) => e.key === "Enter" && onChange(Math.max(1, page - 1))}
        className={arrow}
      >
        ‹
      </div>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const on = page === n
        return (
          <div
            key={n}
            role="button"
            tabIndex={0}
            aria-current={on ? "page" : undefined}
            onClick={() => onChange(n)}
            onKeyDown={(e) => e.key === "Enter" && onChange(n)}
            className={cn(
              "flex h-10 w-10 cursor-pointer items-center justify-center font-infant text-[17px] transition-all duration-200",
              on
                ? "rounded-[15px_15px_15px_5px] bg-seiu-accent text-seiu-on-accent shadow-[0_8px_16px_var(--seiu-shadow2)]"
                : "rounded-full bg-transparent text-seiu-body"
            )}
          >
            {n}
          </div>
        )
      })}
      <span className="px-1 text-seiu-muted">…</span>
      <div
        role="button"
        tabIndex={0}
        aria-label="下一頁"
        onClick={() => onChange(Math.min(total, page + 1))}
        onKeyDown={(e) =>
          e.key === "Enter" && onChange(Math.min(total, page + 1))
        }
        className={arrow}
      >
        ›
      </div>
    </div>
  )
}

/** 側邊欄。選中那項換成實心點與淡底。 */
export function SeiuSidebarNav({
  title,
  items,
  active,
  onSelect,
  className,
}: {
  title?: ReactNode
  items: string[]
  active: string
  onSelect: (item: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "seiu-glass flex flex-col gap-1.5 rounded-blob-lg p-5 shadow-[0_8px_20px_var(--seiu-shadow)]",
        className
      )}
    >
      {title && (
        <div className="p-[6px_14px_10px] text-[13px] text-seiu-muted">
          {title}
        </div>
      )}
      {items.map((n) => {
        const on = active === n
        return (
          <div
            key={n}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(n)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(n)}
            className={cn(
              "flex cursor-pointer items-center gap-[11px] p-[12px_16px] text-base transition-all duration-200",
              on
                ? "rounded-blob-sm bg-seiu-chip text-seiu-accent-ink"
                : "rounded-[14px] bg-transparent text-seiu-body"
            )}
          >
            <span
              className={cn(
                "text-[13px]",
                on ? "text-seiu-accent-ink" : "text-seiu-muted"
              )}
            >
              {on ? "●" : "✦"}
            </span>
            {n}
          </div>
        )
      })}
    </div>
  )
}

/** 行動版抽屜。絕對定位在容器內，不是整頁 overlay。 */
export function SeiuDrawer({
  open,
  onClose,
  items,
}: {
  open: boolean
  onClose: () => void
  items: string[]
}) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-10 flex justify-end bg-[rgba(6,18,38,.42)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[68%] animate-seiu-rise flex-col gap-1.5 rounded-[24px_0_0_24px] bg-seiu-surface p-5 shadow-[-14px_0_30px_var(--seiu-shadow2)] backdrop-blur-[18px]"
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="關閉"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
          className="cursor-pointer self-end rounded-[10px] p-1.5 text-lg text-seiu-muted"
        >
          ×
        </div>
        {items.map((n) => (
          <div
            key={n}
            className="border-b border-dashed border-seiu-dash p-[12px_14px] text-base text-seiu-body"
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 三條長短不一的漢堡線。 */
export function SeiuBurger({
  onClick,
  className,
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="選單"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn("flex cursor-pointer flex-col gap-[5px] p-1.5", className)}
    >
      <span className="block h-0.5 w-[22px] rounded-sm bg-seiu-ink" />
      <span className="block h-0.5 w-[22px] rounded-sm bg-seiu-ink" />
      <span className="block h-0.5 w-3.5 rounded-sm bg-seiu-ink" />
    </div>
  )
}
