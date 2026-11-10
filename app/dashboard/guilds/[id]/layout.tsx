"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { GuildNav } from "@/components/dashboard/guild-nav"
import { BackIcon } from "@/components/dashboard/icons"

const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 伺服器頁的共用外框：返回清單、標題與區塊導覽；各區塊的內容在各自的 page。 */
export default function GuildLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 selection:bg-champagne/40">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <Link
          href="/dashboard"
          className={`inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-champagne ${linkClass}`}
        >
          <BackIcon width={15} height={15} />
          伺服器清單
        </Link>
        <h1 className="mt-4 font-serif text-3xl leading-tight text-primary dark:text-silver">伺服器設定</h1>
        <GuildNav guildId={id} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
