import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-styles"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** 後台操作按鈕。type 不給預設值：表單的 submit 與一般 button 由呼叫端明確指定。 */
export function Button({ variant = "outline", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />
}
