import { cn } from "@/lib/utils"

export type ButtonVariant = "outline" | "danger"
export type ButtonSize = "sm" | "md"

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  outline:
    "border border-champagne/40 text-champagne text-xs tracking-widest uppercase not-disabled:hover:bg-champagne not-disabled:hover:text-background-dark transition-colors disabled:opacity-60",
  danger:
    "border border-red-700/50 dark:border-red-300/50 text-red-700 dark:text-red-300 text-xs tracking-widest uppercase not-disabled:hover:bg-red-700 not-disabled:hover:text-white transition-colors disabled:opacity-60",
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
}

/** Button 與 LinkButton 的 outline 變體共用同一份樣式，避免兩邊各寫一次。 */
export function buttonClass(variant: ButtonVariant = "outline", size: ButtonSize = "md") {
  return cn(VARIANT_CLASS[variant], SIZE_CLASS[size])
}
