import type { AnchorHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { buttonClass } from "./button-styles"

type LinkButtonVariant = "primary" | "secondary" | "text" | "outline"

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkButtonVariant
  external?: boolean
  icon?: ReactNode
}

const VARIANT_CLASS: Record<LinkButtonVariant, string> = {
  primary:
    "inline-flex items-center bg-surface-light/60 dark:bg-surface-dark/60 border border-primary/30 dark:border-champagne/40 text-primary dark:text-champagne backdrop-blur-md px-8 py-4 text-xs tracking-[0.25em] uppercase hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-all duration-300 shadow-[0_0_25px_rgba(196,208,232,0.2)] relative overflow-hidden group",
  secondary:
    "inline-flex items-center bg-surface-light dark:bg-surface-dark border border-primary/30 dark:border-champagne/50 text-primary dark:text-champagne px-8 py-4 uppercase tracking-[0.2em] text-xs hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-colors whitespace-nowrap rounded-sm relative z-10 shadow-[0_0_15px_rgba(196,208,232,0.1)]",
  text:
    "inline-flex items-center text-primary dark:text-champagne uppercase tracking-[0.2em] text-xs border-b border-primary/30 dark:border-champagne/40 pb-1 hover:border-champagne hover:text-gray-900 dark:hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(196,208,232,0.3)]",
  // 後台按鈕沿用 Button 的同一份樣式；呼叫端原本是 inline-block 的 <a>，所以把 inline-block 一起收進變體。
  outline: cn("inline-block", buttonClass("outline", "md")),
}

/**
 * 連結型按鈕。href 維持選用：邀請網址來自環境變數，未設定時不輸出 href。
 * external 時自動補 target 與 rel。
 */
export function LinkButton({
  variant = "primary",
  external = false,
  icon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  // outline 保留呼叫端原本「文字直接放在 <a> 裡」的結構；其餘變體維持既有的 span 包裝。
  const label = variant === "outline" ? children : <span className={variant === "primary" ? "relative z-10" : ""}>{children}</span>

  return (
    <a
      className={cn(VARIANT_CLASS[variant], className)}
      {...props}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {variant === "primary" && (
        <span className="absolute w-full h-full bg-champagne/20 -left-full top-0 group-hover:left-0 transition-all duration-500 ease-out z-0"></span>
      )}
      {label}
      {icon && <span className="ml-2 shrink-0">{icon}</span>}
    </a>
  )
}
