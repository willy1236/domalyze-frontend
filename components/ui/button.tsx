import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { disabledClasses, labelClasses, sizeClasses, variantClasses } from "./styles"

type ButtonVariant = keyof typeof variantClasses
type ButtonSize = keyof typeof sizeClasses

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/**
 * 後台控制項共用的按鈕。type 一律由呼叫端指定（submit／button），元件不設預設值，
 * 免得改掉既有表單的送出行為。
 */
export function Button({ variant = "outline", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(variantClasses[variant], sizeClasses[size], labelClasses, disabledClasses, className)}
      {...props}
    />
  )
}
