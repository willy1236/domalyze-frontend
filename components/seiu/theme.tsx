"use client"

import { useTheme } from "next-themes"
import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * 元件庫的根容器。負責三件事：
 * 1. 掛上 .seiu-root，讓焦點環、連結色、選取色只在庫內生效
 * 2. 鋪晨霧藍底 + 兩團光暈
 * 3. 疊一層會眨的星空
 */
export function SeiuRoot({
  children,
  className,
  stars = true,
}: {
  children: ReactNode
  className?: string
  stars?: boolean
}) {
  return (
    <div
      className={cn(
        "seiu-root relative overflow-x-hidden font-kai text-seiu-ink transition-colors duration-300",
        className
      )}
      style={{
        background: "var(--seiu-bg)",
        backgroundImage:
          "radial-gradient(circle at 18% 12%,var(--seiu-glow1),transparent 42%),radial-gradient(circle at 86% 78%,var(--seiu-glow2),transparent 40%)",
      }}
    >
      {stars && <Starfield />}
      {children}
    </div>
  )
}

/** 固定在視窗上的星點層，深色時更亮。 */
export function Starfield() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 animate-seiu-twinkle transition-opacity duration-500"
      style={{
        opacity: "var(--seiu-stars)",
        backgroundImage: [
          "radial-gradient(circle at 8% 14%,var(--seiu-star1) 0 1.1px,transparent 1.6px)",
          "radial-gradient(circle at 23% 62%,var(--seiu-star3) 0 1px,transparent 1.5px)",
          "radial-gradient(circle at 41% 22%,var(--seiu-star1) 0 1.3px,transparent 1.8px)",
          "radial-gradient(circle at 57% 78%,var(--seiu-star2) 0 1.1px,transparent 1.6px)",
          "radial-gradient(circle at 69% 36%,var(--seiu-star1) 0 1px,transparent 1.5px)",
          "radial-gradient(circle at 84% 8%,var(--seiu-star3) 0 1.2px,transparent 1.7px)",
          "radial-gradient(circle at 92% 54%,var(--seiu-star1) 0 1px,transparent 1.5px)",
          "radial-gradient(circle at 16% 88%,var(--seiu-star1) 0 1.2px,transparent 1.7px)",
          "radial-gradient(circle at 76% 94%,var(--seiu-star3) 0 1px,transparent 1.5px)",
        ].join(","),
      }}
    />
  )
}

/**
 * 包一層 next-themes，補上 SSR 前的 mounted 判斷。
 * 沒掛載完就先當亮色，避免 hydration 對不上。
 */
export function useSeiuTheme() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === "dark"
  return {
    dark,
    mounted,
    toggle: () => setTheme(dark ? "light" : "dark"),
    label: dark ? "☀ 亮色模式" : "☾ 夜間模式",
  }
}

/** 表單裡那顆會滑的夜間模式開關。 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { dark, toggle } = useSeiuTheme()
  return (
    <div
      role="switch"
      tabIndex={0}
      aria-checked={dark}
      aria-label="夜間模式"
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          toggle()
        }
      }}
      className={cn(
        "box-border flex h-[30px] w-[58px] cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200",
        dark ? "justify-end bg-seiu-accent" : "justify-start bg-seiu-field2",
        className
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-seiu-surface text-xs text-seiu-label shadow-[0_2px_6px_var(--seiu-shadow2)]">
        {dark ? "✦" : ""}
      </div>
    </div>
  )
}
