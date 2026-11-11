"use client"

import { useCallback } from "react"
import { useParams } from "next/navigation"
import { dashboardFetch } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"
import type { NotifyItem, NotifyLists } from "@/lib/dashboard-notifies"
import { ChannelNotifySection } from "@/components/dashboard/channel-notify-section"
import { CommunityNotifySection } from "@/components/dashboard/community-notify-section"
import { WarnIcon } from "@/components/dashboard/icons"
import { SectionGuard } from "@/components/dashboard/section-guard"

function isInvalid(item: NotifyItem): boolean {
  return item.channel.invalid !== null || (item.role?.invalid ?? null) !== null
}

const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 通知是伺服器頁的預設落點：沒有 Manage Channels 的人靜默導向第一個有權限的區塊，不會送出通知請求。 */
export default function GuildPage() {
  return (
    <SectionGuard section="notify" silent>
      <NotifySections />
    </SectionGuard>
  )
}

function NotifySections() {
  const { id } = useParams<{ id: string }>()
  const fetcher = useCallback(
    (signal: AbortSignal) =>
      dashboardFetch<NotifyLists>(`/dashboard/guilds/${encodeURIComponent(id)}/notifies`, {}, { signal }),
    [id],
  )
  const { data: lists, failed, reload } = useLoad(fetcher)

  const channelCount = lists?.channel_notifies.length ?? 0
  const communityCount = lists?.community_notifies.length ?? 0
  const invalidCount = lists
    ? [...lists.channel_notifies, ...lists.community_notifies].filter(isInvalid).length
    : 0

  return (
    <div className="min-w-0 space-y-14">
      {lists && (
        <div className="space-y-3">
          <nav aria-label="通知區塊" className="flex flex-wrap gap-2 text-sm">
            <a
              href="#channel-notifies"
              className={`flex items-baseline gap-3 rounded-md border border-primary/20 dark:border-champagne/25 px-3 py-1.5 hover:bg-primary/5 dark:hover:bg-champagne/10 ${linkClass}`}
            >
              頻道通知
              <span className="tabular-nums text-gray-600 dark:text-gray-400">{channelCount}</span>
            </a>
            <a
              href="#community-notifies"
              className={`flex items-baseline gap-3 rounded-md border border-primary/20 dark:border-champagne/25 px-3 py-1.5 hover:bg-primary/5 dark:hover:bg-champagne/10 ${linkClass}`}
            >
              社群推播
              <span className="tabular-nums text-gray-600 dark:text-gray-400">{communityCount}</span>
            </a>
          </nav>
          {invalidCount > 0 && (
            <p className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
              <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
              {invalidCount} 筆設定已失效，bot 目前發不出去。
            </p>
          )}
        </div>
      )}

      {failed && (
        <p className="text-gray-600 dark:text-gray-400">
          無法載入通知設定，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void reload()}>
            重試
          </button>
          。
        </p>
      )}

      {lists === null && !failed && <p className="text-gray-600 dark:text-gray-400">載入中…</p>}

      {lists && (
        <div className="space-y-14 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <ChannelNotifySection guildId={id} items={lists.channel_notifies} onChanged={() => void reload()} />
          <CommunityNotifySection guildId={id} items={lists.community_notifies} onChanged={() => void reload()} />
        </div>
      )}
    </div>
  )
}
