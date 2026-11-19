"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ChannelAccessGuard } from "@/components/dashboard/channel/channel-access-guard"
import { ChannelHeader } from "@/components/dashboard/channel/channel-header"
import { ChannelNav } from "@/components/dashboard/channel/channel-nav"
import { BackIcon } from "@/components/dashboard/icons"
import { CHANNEL_LIST_PATH } from "@/lib/dashboard-channel"

const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 頻道頁的共用外框：載入與權限由 ChannelAccessGuard 處理，外框只組合頁首、區塊導覽與各區塊的內容。 */
export default function ChannelLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  return (
    <ChannelAccessGuard channelId={id}>
      <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 selection:bg-champagne/40">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Link
            href={CHANNEL_LIST_PATH}
            className={`inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-champagne ${linkClass}`}
          >
            <BackIcon width={15} height={15} />
            頻道清單
          </Link>
          <div className="mt-4">
            <ChannelHeader />
          </div>
          <ChannelNav channelId={id} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </ChannelAccessGuard>
  )
}
