"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { HEALTH_CONCURRENCY, createLimiter, fetchOpsChannels, isNotBotOwner, totalPages } from "@/lib/dashboard-ops"
import { useLoad } from "@/lib/use-load"
import { OpsChannelRow } from "./ops-channel-row"
import { OpsForbidden } from "./ops-forbidden"

/** 營運入口的頻道清單：只載入 DB 狀態，已啟用的頻道再逐列補查權限問題（同時最多 HEALTH_CONCURRENCY 個）。 */
export function OpsChannelList() {
  const [page, setPage] = useState(1)
  const fetcher = useCallback((signal: AbortSignal) => fetchOpsChannels(page, signal), [page])
  const { data, error, failed, reload } = useLoad(fetcher, { keepPrevious: true })
  // 整個清單共用同一個限流器：翻頁時前一頁的列卸載會中止它們排隊中的請求
  const [limiter] = useState(() => createLimiter(HEALTH_CONCURRENCY))

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className="text-gray-500 dark:text-gray-400">無法載入頻道清單，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className="text-gray-500 dark:text-gray-400">載入中…</p>

  const pages = totalPages(data.total, data.page_size)
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">共 {data.total} 個頻道</p>
      {data.channels.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">還沒有頻道</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.channels.map((channel) => (
            <OpsChannelRow key={channel.id} channel={channel} limiter={limiter} onChanged={reload} />
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="分頁" className="flex items-center gap-3">
          <Button type="button" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一頁
          </Button>
          <span className="text-sm tabular-nums">
            {page}／{pages}
          </span>
          <Button type="button" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            下一頁
          </Button>
        </nav>
      )}
    </div>
  )
}
