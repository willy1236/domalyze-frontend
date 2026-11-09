import type { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { fieldClasses } from "./styles"

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, "w-full bg-transparent", className)} {...props} />
}
