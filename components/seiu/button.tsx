"use client"

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react"
import { cn } from "@/lib/utils"

export type SeiuButtonVariant =
  | "primary" // 薰衣草紫，主要動作
  | "panel" // 夜空藍深底
  | "mint" // 髮梢天藍
  | "outline" // 虛線描邊
  | "text" // 純文字
  | "gold" // 限定標記，少於 5%
  | "chip" // 小一點的圓角膠囊

export type SeiuButtonSize = "sm" | "md" | "lg"

const VARIANTS: Record<SeiuButtonVariant, string> = {
  primary:
    "bg-seiu-accent text-seiu-on-accent shadow-[0_8px_20px_var(--seiu-shadow2)] rounded-blob-lg",
  panel:
    "seiu-glass-panel border-0 text-seiu-on-panel shadow-[0_8px_20px_var(--seiu-shadow)] rounded-blob-lg",
  mint: "bg-seiu-mint text-seiu-on-mint rounded-blob-lg",
  outline:
    "bg-transparent text-seiu-accent-ink border-[1.5px] border-dashed border-seiu-dash hover:border-seiu-accent-ink rounded-blob-lg",
  text: "bg-transparent text-seiu-accent-ink px-2",
  gold: "bg-seiu-gold-bg text-seiu-gold-ink rounded-lg -rotate-2",
  chip: "bg-seiu-chip text-seiu-accent-ink rounded-full",
}

const SIZES: Record<SeiuButtonSize, string> = {
  sm: "text-sm px-5 py-[9px]",
  md: "text-base px-[30px] py-[14px]",
  lg: "text-base px-[34px] py-[15px]",
}

// 只有帶底色的實心按鈕才會在 hover 時浮起來。
const LIFTS: SeiuButtonVariant[] = ["primary", "panel", "mint", "outline"]

function buttonClass(
  variant: SeiuButtonVariant,
  size: SeiuButtonSize,
  disabled: boolean,
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 cursor-pointer border-0 font-kai tracking-[0.1em] transition-all duration-200",
    VARIANTS[variant],
    variant === "text" ? "py-[14px]" : SIZES[size],
    LIFTS.includes(variant) &&
      !disabled &&
      "hover:-translate-y-[3px] active:translate-y-0 active:brightness-95",
    disabled &&
      "cursor-not-allowed bg-seiu-field2 text-seiu-muted shadow-none hover:translate-y-0",
    className
  )
}

export interface SeiuButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SeiuButtonVariant
  size?: SeiuButtonSize
  children: ReactNode
}

export function SeiuButton({
  variant = "primary",
  size = "md",
  className,
  disabled,
  children,
  ...props
}: SeiuButtonProps) {
  return (
    <button
      disabled={disabled}
      className={buttonClass(variant, size, !!disabled, className)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface SeiuLinkButtonProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: SeiuButtonVariant
  size?: SeiuButtonSize
  /** 外部連結會補上 target 與 rel。 */
  external?: boolean
  children: ReactNode
}

/** 長得跟 SeiuButton 一樣，但渲染成 <a>。導向用的動作走這個。 */
export function SeiuLinkButton({
  variant = "primary",
  size = "md",
  external = false,
  className,
  children,
  ...props
}: SeiuLinkButtonProps) {
  return (
    <a
      className={buttonClass(variant, size, false, className)}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      {...props}
    >
      {children}
    </a>
  )
}

/** 圓形的小圖示按鈕，hover 時會歪一下。 */
export function SeiuIconButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={cn(
        "seiu-glass flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border-0 text-[19px] text-seiu-accent-ink shadow-[0_8px_18px_var(--seiu-shadow)] transition-all duration-200 hover:-translate-y-[3px] hover:-rotate-[10deg]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
