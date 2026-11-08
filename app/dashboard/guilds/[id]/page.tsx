"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { dashboardFetch } from "@/lib/dashboard-api"
import type { NotifyLists } from "@/lib/dashboard-notifies"
import { ChannelNotifySection } from "@/components/dashboard/channel-notify-section"
import { CommunityNotifySection } from "@/components/dashboard/community-notify-section"

export default function GuildPage() {
  const { id } = useParams<{ id: string }>()
  const [lists, setLists] = useState<NotifyLists | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      try {
        setLists(await dashboardFetch<NotifyLists>(`/dashboard/guilds/${encodeURIComponent(id)}/notifies`, {}, { signal }))
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


  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-serif">伺服器通知</h1>
        <Link
          href="/dashboard"
          className="text-xs tracking-widest uppercase text-champagne hover:underline shrink-0"
        >
          ← 伺服器清單
        </Link>
      </div>

      {failed && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          無法載入通知設定，請稍後
          <button type="button" className="underline mx-1" onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}

      {lists === null && !failed && <p className="text-gray-500 dark:text-gray-400">載入中…</p>}

      {lists && (
        <>
          <ChannelNotifySection items={lists.channel_notifies} />
          <CommunityNotifySection items={lists.community_notifies} />
        </>
      )}
    </section>
  )
}
