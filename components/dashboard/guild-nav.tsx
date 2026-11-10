"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useGuildSections } from "@/components/dashboard/guild-sections"
import { sectionBasePath, sectionHref, visibleNavItems } from "@/lib/dashboard-sections"

const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 伺服器頁的區塊導覽；每個區塊有自己的網址，依使用者的區塊權限過濾，並依目前路徑標示所在位置。 */
export function GuildNav({ guildId }: { guildId: string }) {
  const pathname = usePathname()
  const base = sectionBasePath(guildId)
  const { sections } = useGuildSections()
  const items = visibleNavItems(sections ?? []).map((item) => ({
    key: item.key,
    label: item.label,
    href: sectionHref(guildId, item),
    // 通知就是伺服器頁本身，只在網址完全相符時算所在位置；其他區塊含子路徑
    active: item.path === "" ? pathname === base : pathname.startsWith(`${base}${item.path}`),
  }))
  return (
    <nav aria-label="伺服器設定區塊" className="mt-5 flex flex-wrap gap-2 lg:flex-col lg:gap-1 text-sm">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`rounded-md border px-3 py-1.5 hover:bg-primary/5 dark:hover:bg-champagne/10 ${linkClass} ${
            item.active
              ? "border-primary/40 dark:border-champagne/50 bg-primary/5 dark:bg-champagne/10 text-primary dark:text-silver"
              : "border-primary/20 dark:border-champagne/25 lg:border-transparent lg:dark:border-transparent"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
