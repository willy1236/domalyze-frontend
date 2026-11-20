"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { OPS_PATH } from "@/lib/dashboard-ops"
import { OPS_DISCORD_PATH } from "@/lib/dashboard-ops-discord"
import { OPS_WEBSITE_PATH } from "@/lib/dashboard-ops-website"

const TABS = [
  { href: OPS_PATH, label: "Twitch 頻道", active: (p: string) => p === OPS_PATH || p.startsWith(`${OPS_PATH}/channels`) },
  { href: OPS_DISCORD_PATH, label: "Discord 伺服器", active: (p: string) => p.startsWith(OPS_DISCORD_PATH) },
  { href: OPS_WEBSITE_PATH, label: "網站", active: (p: string) => p.startsWith(OPS_WEBSITE_PATH) },
]

/** 營運入口的平台分頁。 */
export function OpsTabs() {
  const pathname = usePathname()
  return (
    <nav aria-label="營運平台" className="flex flex-wrap gap-2 text-sm">
      {TABS.map((tab) => {
        const active = tab.active(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 outline-none hover:bg-primary/5 dark:hover:bg-champagne/10 focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne ${
              active
                ? "border-primary/40 dark:border-champagne/50 bg-primary/5 dark:bg-champagne/10 text-primary dark:text-silver"
                : "border-primary/20 dark:border-champagne/25"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
