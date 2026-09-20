"use client"

import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react"
import { cn } from "@/lib/utils"

const FIELD_BASE =
  "w-full box-border font-kai text-base text-seiu-ink bg-seiu-field border-[1.5px] border-transparent rounded-blob px-[18px] py-[14px] outline-none transition-all duration-200 focus:border-seiu-accent-ink placeholder:text-seiu-muted"

/** 標籤在上、欄位在下的直式欄位。 */
export function SeiuField({
  label,
  children,
  className,
}: {
  label: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-[9px]", className)}>
      <span className="text-sm text-seiu-label">{label}</span>
      {children}
    </label>
  )
}

export function SeiuInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, className)} {...props} />
}

export function SeiuTextarea({
  className,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(FIELD_BASE, "resize-y leading-[2]", className)}
      {...props}
    />
  )
}

/** 方形勾選框，勾起來是一顆星。 */
export function SeiuCheckbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  className?: string
}) {
  return (
    <div
      role="checkbox"
      tabIndex={0}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[10px] text-base text-seiu-body",
        className
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-blob-xs text-[13px] text-seiu-on-accent transition-colors duration-200",
          checked ? "bg-seiu-accent" : "bg-seiu-field2"
        )}
      >
        {checked ? "✦" : ""}
      </span>
      {label}
    </div>
  )
}

export interface SeiuRadioOption<T extends string> {
  value: T
  label: ReactNode
}

export function SeiuRadioGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (next: T) => void
  options: SeiuRadioOption<T>[]
  className?: string
}) {
  return (
    <div className={cn("flex gap-7 pt-0.5", className)} role="radiogroup">
      {options.map((opt) => {
        const on = value === opt.value
        return (
          <div
            key={opt.value}
            role="radio"
            tabIndex={0}
            aria-checked={on}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onChange(opt.value)
              }
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-[10px] text-base text-seiu-body"
          >
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-seiu-field2">
              {on && (
                <span className="h-[11px] w-[11px] rounded-full bg-seiu-accent" />
              )}
            </span>
            {opt.label}
          </div>
        )
      })}
    </div>
  )
}

/** 帶標題與數值的滑桿，軌道是薰衣草到天藍的漸層。 */
export function SeiuSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = "%",
  className,
}: {
  label: ReactNode
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  unit?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-seiu-label">{label}</span>
        <span className="font-infant text-[22px] text-seiu-accent-ink">
          {value}
          <span className="text-[13px] text-seiu-muted">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="seiu-range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--seiu-accent-ink)" }}
      />
    </div>
  )
}

/** 膠囊搜尋列，右邊掛一個清除。 */
export function SeiuSearchInput({
  value,
  onChange,
  placeholder = "找找看…",
  className,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-seiu-edge-soft bg-seiu-field px-[22px] py-[13px]",
        className
      )}
    >
      <span className="text-[15px] text-seiu-label">✦</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent font-kai text-base text-seiu-ink outline-none placeholder:text-seiu-muted"
      />
      <span
        role="button"
        tabIndex={0}
        onClick={() => onChange("")}
        onKeyDown={(e) => e.key === "Enter" && onChange("")}
        className="cursor-pointer text-[13px] text-seiu-muted"
      >
        清除
      </span>
    </div>
  )
}

/** 自訂下拉：關著是一格欄位，展開是一張浮起來的小卡。 */
export function SeiuDropdown({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: string[]
  onChange: (next: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-controls="seiu-dropdown-list"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((o) => !o)
          }
          if (e.key === "Escape") setOpen(false)
        }}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-blob bg-seiu-field px-[18px] py-[14px] text-base text-seiu-ink"
      >
        {value}
        <span
          className={cn(
            "text-[13px] text-seiu-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        >
          ▾
        </span>
      </div>
      {open && (
        <div
          id="seiu-dropdown-list"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+8px)] z-20 animate-seiu-rise rounded-blob bg-seiu-surface p-2 shadow-[0_16px_34px_var(--seiu-shadow2)] backdrop-blur-[18px]"
        >
          {options.map((o) => (
            <div
              key={o}
              role="option"
              aria-selected={value === o}
              tabIndex={0}
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onChange(o)
                  setOpen(false)
                }
              }}
              className={cn(
                "cursor-pointer rounded-xl px-3.5 py-[11px] text-base",
                value === o
                  ? "bg-seiu-chip text-seiu-accent-ink"
                  : "bg-transparent text-seiu-body"
              )}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
