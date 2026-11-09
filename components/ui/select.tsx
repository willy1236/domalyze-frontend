import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "./styles"

// 原生下拉選單的彈出層不吃 bg-transparent，會變成白底配淺色字；select 與 option 都明確指定底色。
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        fieldClasses,
        "w-full bg-background-light dark:bg-background-dark [&>option]:bg-background-light dark:[&>option]:bg-background-dark",
        className,
      )}
      {...props}
    />
  )
}
