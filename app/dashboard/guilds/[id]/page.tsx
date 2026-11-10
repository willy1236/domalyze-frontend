"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { dashboardFetch } from "@/lib/dashboard-api"
import type { NotifyItem, NotifyLists } from "@/lib/dashboard-notifies"
import { ChannelNotifySection } from "@/components/dashboard/channel-notify-section"
import { CommunityNotifySection } from "@/components/dashboard/community-notify-section"
import { WarnIcon } from "@/components/dashboard/icons"

function isInvalid(item: NotifyItem): boolean {
  return item.channel.invalid !== null || (item.role?.invalid ?? null) !== null
}

const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

export default function GuildPage() {
  const { id } = useParams<{ id: string }>()
  const [lists, setLists] = useState<NotifyLists | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      try {
        setLists(
          await dashboardFetch<NotifyLists>(`/dashboard/guilds/${encodeURIComponent(id)}/notifies`, {}, { signal }),
        )
      } catch (e) {
        if (signal?.aborted) return
        console.error("load notifies failed", e)
        setFailed(true)
      }
    },
    [id],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

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
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}

      {lists === null && !failed && <p className="text-gray-600 dark:text-gray-400">載入中…</p>}

      {lists && (
        <div className="space-y-14 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <ChannelNotifySection guildId={id} items={lists.channel_notifies} onChanged={() => void load()} />
          <CommunityNotifySection guildId={id} items={lists.community_notifies} onChanged={() => void load()} />
        </div>
      )}
    </div>
  )
}
