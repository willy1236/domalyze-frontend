"use client"

import { ReactNode } from "react"

interface HomeButtonProps {
  href: string
  children: ReactNode
  variant?: "primary" | "secondary" | "text"
  external?: boolean
  icon?: ReactNode
  className?: string
}

export function HomeButton({
  href,
  children,
  variant = "primary",
  external = false,
  icon,
  className = ""
}: HomeButtonProps) {
  const baseProps = {
    href,
    ...(external && { target: "_blank", rel: "noopener noreferrer" })
  }

  const variants = {
    primary: "inline-flex items-center bg-surface-light/60 dark:bg-surface-dark/60 border border-champagne/40 text-champagne backdrop-blur-md px-8 py-4 text-xs tracking-[0.25em] uppercase hover:bg-champagne hover:text-background-dark transition-all duration-300 shadow-[0_0_25px_rgba(196,208,232,0.2)] relative overflow-hidden group",
    secondary: "inline-flex items-center bg-surface-light dark:bg-surface-dark border border-champagne/50 text-champagne px-8 py-4 uppercase tracking-[0.2em] text-xs hover:bg-champagne hover:text-background-dark transition-colors whitespace-nowrap rounded-sm relative z-10 shadow-[0_0_15px_rgba(196,208,232,0.1)]",
    text: "inline-flex items-center text-champagne uppercase tracking-[0.2em] text-xs border-b border-champagne/40 pb-1 hover:border-champagne hover:text-gray-900 dark:hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(196,208,232,0.3)]"
  }

  const buttonClass = `${variants[variant]} ${className}`

  return (
    <a className={buttonClass} {...baseProps}>
      {variant === "primary" && (
        <span className="absolute w-full h-full bg-champagne/20 -left-full top-0 group-hover:left-0 transition-all duration-500 ease-out z-0"></span>
      )}
      <span className={variant === "primary" ? "relative z-10" : ""}>
        {children}
      </span>
      {icon && (
        <span className="ml-2 shrink-0">
          {icon}
        </span>
      )}
    </a>
  )
}
