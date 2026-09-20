"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface SeiuColumn<Row> {
  key: string
  header: ReactNode
  align?: "left" | "right"
  /** 色值那一欄走 Ysabeau Infant。 */
  mono?: boolean
  render: (row: Row) => ReactNode
}

/**
 * 列與列之間留空隙，每一列自己是一塊圓角底。
 * hover 時整列往右挪 5px。
 */
export function SeiuTable<Row>({
  columns,
  rows,
  rowKey,
  className,
}: {
  columns: SeiuColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row, index: number) => string
  className?: string
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[540px] border-separate border-spacing-y-2 text-[15px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "p-[10px_18px] text-sm font-normal text-seiu-label",
                  c.align === "right" ? "text-right" : "text-left"
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className="transition-transform duration-200 hover:translate-x-[5px]"
            >
              {columns.map((c, ci) => (
                <td
                  key={c.key}
                  className={cn(
                    "bg-seiu-field p-[16px_18px]",
                    ci === 0 && "rounded-[18px_0_0_6px]",
                    ci === columns.length - 1 && "rounded-[0_18px_18px_0]",
                    c.align === "right" && "text-right",
                    c.mono && "font-infant text-seiu-body"
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export interface SeiuGalleryItem {
  title: string
  kind: string
  media?: ReactNode
}

/** 作品牆。欄數 2–4，超出範圍會夾回來。 */
export function SeiuGallery({
  items,
  columns = 3,
  className,
}: {
  items: SeiuGalleryItem[]
  columns?: number
  className?: string
}) {
  const cols = Math.min(4, Math.max(2, columns))

  return (
    <div
      className={cn("grid gap-[18px]", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill,minmax(${Math.round(940 / cols)}px,1fr))`,
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.title}
          tabIndex={0}
          className="seiu-glass cursor-pointer overflow-hidden rounded-blob-md shadow-[0_8px_20px_var(--seiu-shadow)] transition-transform duration-200 hover:-translate-y-1"
        >
          <div className="flex aspect-[4/3] items-center justify-center bg-[repeating-linear-gradient(135deg,var(--seiu-field)_0_8px,var(--seiu-field2)_8px_16px)]">
            {it.media ?? (
              <span className="rounded-full bg-seiu-surface px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-seiu-muted">
                IMAGE {i + 1}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2.5 p-[14px_16px]">
            <span className="text-[15px]">{it.title}</span>
            <span className="rounded-full bg-seiu-field2 px-[11px] py-1 text-xs text-seiu-label">
              {it.kind}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface SeiuAccordionItem {
  title: ReactNode
  body: ReactNode
}

/** 一次只開一項；再點一次全收起來。 */
export function SeiuAccordion({
  items,
  defaultOpen = 0,
  className,
}: {
  items: SeiuAccordionItem[]
  defaultOpen?: number
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((it, i) => {
        const on = open === i
        const toggle = () => setOpen(on ? -1 : i)
        return (
          <div key={i} className="border-b border-dashed border-seiu-dash">
            <div
              role="button"
              tabIndex={0}
              aria-expanded={on}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggle()
                }
              }}
              className="flex cursor-pointer items-center gap-[13px] rounded-[10px] py-5 text-[17px] tracking-[0.04em] text-seiu-ink"
            >
              <span
                className={cn(
                  "text-[15px]",
                  on ? "text-seiu-accent-ink" : "text-seiu-muted"
                )}
              >
                {on ? "●" : "✦"}
              </span>
              <span className="flex-1">{it.title}</span>
              <span
                className={cn(
                  "text-base text-seiu-muted transition-transform duration-200",
                  on && "rotate-45"
                )}
              >
                ＋
              </span>
            </div>
            {on && (
              <div className="max-w-[50ch] p-[0_0_22px_28px] text-[15px] font-light leading-[2.1] text-seiu-body">
                {it.body}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
