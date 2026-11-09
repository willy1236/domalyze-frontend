import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/**
 * 功能卡片的玻璃容器。呼叫端可傳 className 調整個別差異（例如轉場改成 transition-colors），
 * 由 cn 覆寫而非字串相加。
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
