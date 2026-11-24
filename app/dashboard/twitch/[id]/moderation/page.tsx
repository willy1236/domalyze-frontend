"use client"

import { useCallback } from "react"
import { useChannel, useChannelError } from "@/components/dashboard/channel/channel-access-guard"
import { ModerationFilterCard, type ModerationFilter } from "@/components/dashboard/channel/moderation-filter-card"
import { Button } from "@/components/ui"
import { dashboardFetch } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"

export default function ChannelModerationPage() {
  const channel = useChannel()
  const handleChannelError = useChannelError()
  const endpoint = `/dashboard/channels/${encodeURIComponent(channel.id)}/moderation`
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const data = await dashboardFetch<{ filters: ModerationFilter[] }>(endpoint, {}, { signal })
    return data.filters
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
        <div className="space-y-4">
          {data.map((filter) => (
            <ModerationFilterCard
              key={channel.id + JSON.stringify(filter)}
              filter={filter}
              endpoint={endpoint + "/filters/" + filter.kind}
              disabled={readOnly || loading}
              onReload={reload}
            />
          ))}
        </div>
      ) : (
        <p aria-busy="true" role="status">載入中…</p>
      )}
    </section>
  )
}
