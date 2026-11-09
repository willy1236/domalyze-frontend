import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "./styles"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, "bg-transparent", className)} {...props} />
}
