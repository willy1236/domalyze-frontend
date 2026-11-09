import type { AnchorHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { labelClasses, sizeClasses, variantClasses } from "./styles"

type LinkButtonVariant = "primary" | "secondary" | "text" | "outline"

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 不設定時（例如邀請網址未設定）不輸出 href，與原本的 <a> 行為一致 */
  href: string | undefined
  variant?: LinkButtonVariant
  /** 外連：新分頁開啟並帶 noopener */
  external?: boolean
  /** 放在文字後方的圖示 */
  icon?: ReactNode
}

const variants: Record<LinkButtonVariant, string> = {
  primary:
    "inline-flex items-center bg-surface-light/60 dark:bg-surface-dark/60 border border-primary/30 dark:border-champagne/40 text-primary dark:text-champagne backdrop-blur-md px-8 py-4 text-xs tracking-[0.25em] uppercase hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-all duration-300 shadow-[0_0_25px_rgba(196,208,232,0.2)] relative overflow-hidden group",
  secondary:
    "inline-flex items-center bg-surface-light dark:bg-surface-dark border border-champagne/50 text-champagne px-8 py-4 uppercase tracking-[0.2em] text-xs hover:bg-champagne hover:text-background-dark transition-colors whitespace-nowrap rounded-sm relative z-10 shadow-[0_0_15px_rgba(196,208,232,0.1)]",
  text: "inline-flex items-center text-primary dark:text-champagne uppercase tracking-[0.2em] text-xs border-b border-primary/30 dark:border-champagne/40 pb-1 hover:border-champagne hover:text-gray-900 dark:hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(196,208,232,0.3)]",
  // 色票與字級沿用 Button 的同一份字串，這裡只補連結需要的 inline-block；
  // disabled 樣式是原生按鈕專用，連結套不到 :disabled，所以不帶。
  outline: cn("inline-block", variantClasses.outline, sizeClasses.md, labelClasses),
}

/**
 * 看起來像按鈕的連結（外觀取自原本的 HomeButton）。內部連結仍渲染原生 `<a>`，
 * 不換成 next/link，避免 prefetch 與行為改變。
 */
export function LinkButton({
  href,
  variant = "primary",
  external = false,
  icon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  // outline 沿用呼叫端原本「文字直接放連結裡」的結構；其餘外觀維持既有的 span 包裝
  const label =
    variant === "outline" ? (
      children
    ) : (
      <span className={variant === "primary" ? "relative z-10" : ""}>{children}</span>
    )

  return (
    <a
      className={cn(variants[variant], className)}
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      {...props}
    >
      {variant === "primary" && (
        <span className="absolute w-full h-full bg-champagne/20 -left-full top-0 group-hover:left-0 transition-all duration-500 ease-out z-0"></span>
      )}
      {label}
      {icon && <span className="ml-2 shrink-0">{icon}</span>}
    </a>
  )
}
