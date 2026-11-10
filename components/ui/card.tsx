import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/**
 * 官網的功能卡片外框。底色、描邊與 hover 邊框都收在這裡，呼叫端只補差異（例如 hover 陰影、transition 種類）。
 * 合併用 cn，所以呼叫端傳進來的 class 會覆蓋這裡的同類樣式。
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group relative p-8 border border-transparent hover:border-champagne/20 transition-all duration-500 bg-background-light/50 dark:bg-background-dark/20 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  )
}
