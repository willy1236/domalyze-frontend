"use client"

import { SeiuDivider } from "@/components/seiu"

const LINKS = [
  { href: "/", label: "首頁" },
  { href: "/features", label: "功能" },
  { href: "#", label: "隱私權政策" },
]

export function Footer() {
  return (
    <footer className="seiu-glass-panel relative overflow-hidden border-x-0 border-b-0 py-16">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 lg:px-12">
        <a
          href="/"
          className="flex items-center gap-3 text-2xl tracking-[0.3em] text-seiu-on-panel transition-opacity hover:opacity-80"
        >
          <span className="text-sm text-[#C8EAFF]">✦</span> Xingyu{" "}
          <span className="text-sm text-[#C8EAFF]">✦</span>
        </a>

        <SeiuDivider className="w-24" />

        <nav className="flex gap-10 text-xs tracking-[0.2em] text-seiu-panel-body">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-2 transition-colors hover:text-seiu-on-panel"
            >
              <span className="text-[8px] opacity-70">✧</span> {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-4 font-infant text-xs tracking-[0.14em] text-seiu-panel-muted">
          © 2026 星羽 Discord 機器人 (Xingyu Bot)。保留所有權利。
        </div>
      </div>
    </footer>
  )
}
