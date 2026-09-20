"use client"

import { Moon, Sun } from "lucide-react"
import {
  SeiuIconButton,
  SeiuLinkButton,
  useSeiuTheme,
} from "@/components/seiu"

const NAV_LINKS = [
  { href: "/features", label: "功能" },
  { href: "#performance", label: "平台" },
  { href: "#preorder", label: "邀請" },
]

export function Header() {
  const { dark, toggle } = useSeiuTheme()

  return (
    <header className="relative left-0 top-0 z-40 w-full border-b border-seiu-edge-soft">
      <div className="seiu-dotted absolute inset-x-0 bottom-0 h-0.5" />
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-12">
        <a
          href="/"
          className="flex items-center gap-2 text-2xl tracking-[0.18em] text-seiu-ink transition-opacity hover:opacity-80"
        >
          <span className="animate-seiu-sparkle text-lg text-seiu-accent-ink">
            ✦
          </span>{" "}
          Xingyu
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link, i) => (
            <div key={link.href} className="flex items-center gap-6">
              <a
                href={link.href}
                className="text-sm tracking-[0.2em] text-seiu-label transition-colors hover:text-seiu-ink"
              >
                {link.label}
              </a>
              {i < NAV_LINKS.length - 1 && (
                <span className="text-xs text-seiu-muted">✧</span>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <SeiuIconButton
            onClick={toggle}
            aria-label={dark ? "切換為亮色模式" : "切換為夜間模式"}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </SeiuIconButton>
          <SeiuLinkButton
            href="#preorder"
            variant="mint"
            size="sm"
            className="hidden sm:inline-flex"
          >
            邀請
          </SeiuLinkButton>
        </div>
      </div>
    </header>
  )
}
