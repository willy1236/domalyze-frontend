"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CHANNEL_NAV, channelSectionHref, isChannelSectionActive } from "@/lib/dashboard-channel-sections"

const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 頻道頁的區塊導覽；每個區塊有自己的網址，依目前路徑標示所在位置。 */
export function ChannelNav({ channelId }: { channelId: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label="頻道設定區塊" className="mt-5 flex flex-wrap gap-2 lg:flex-col lg:gap-1 text-sm">
      {CHANNEL_NAV.map((item) => {
        const active = isChannelSectionActive(channelId, item, pathname)
        return (
          <Link
            key={item.key}
            href={channelSectionHref(channelId, item)}
            aria-current={active ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 hover:bg-primary/5 dark:hover:bg-champagne/10 ${linkClass} ${
              active
                ? "border-primary/40 dark:border-champagne/50 bg-primary/5 dark:bg-champagne/10 text-primary dark:text-silver"
                : "border-primary/20 dark:border-champagne/25 lg:border-transparent lg:dark:border-transparent"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
