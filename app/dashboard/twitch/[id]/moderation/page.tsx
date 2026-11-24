"use client"

import { useCallback } from "react"
import { useChannel, useChannelError } from "@/components/dashboard/channel/channel-access-guard"
import { ModerationFilterCard, type LinkFilter } from "@/components/dashboard/channel/moderation-filter-card"
import { Button } from "@/components/ui"
import { dashboardFetch } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"

export default function ChannelModerationPage() {
  const channel = useChannel()
  const handleChannelError = useChannelError()
  const endpoint = `/dashboard/channels/${encodeURIComponent(channel.id)}/moderation`
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const data = await dashboardFetch<{ filters: LinkFilter[] }>(endpoint, {}, { signal })
    const filter = data.filters.find((item) => item.kind === "link")
    if (!filter) throw new Error("找不到連結過濾設定")
    return filter
  }, [endpoint])
  const { data, failed, loading, reload } = useLoad(fetcher, { onError: handleChannelError })
  const readOnly = channel.state !== "enabled"

  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">聊天室管理</h2>
      {readOnly && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">星羽啟用後才能修改聊天室管理設定。</p>
      )}
      {failed ? (
        <div className="border border-champagne/30 px-4 py-6">
          <p className="mb-4" role="alert">無法載入聊天室管理設定。</p>
          <Button type="button" onClick={() => void reload()}>重新載入</Button>
        </div>
      ) : data ? (
        <ModerationFilterCard
          key={channel.id + JSON.stringify(data)}
          filter={data}
          endpoint={endpoint + "/filters/link"}
          disabled={readOnly || loading}
          onReload={reload}
        />
      ) : (
        <p aria-busy="true" role="status">載入中…</p>
      )}
    </section>
  )
}
