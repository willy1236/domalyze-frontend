"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { OPS_PATH, fetchOpsAudit, isNotBotOwner } from "@/lib/dashboard-ops"
import { AuditList } from "@/components/dashboard/audit-list"
import { healthStatusLabel } from "@/lib/dashboard-channel-health"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

/** 某頻道的修改紀錄：操作者、時間、來源、修改前與修改後。 */
export function OpsAuditList({ channelId }: { channelId: string }) {
  const [page, setPage] = useState(1)
  const fetcher = useCallback((signal: AbortSignal) => fetchOpsAudit(channelId, page, signal), [channelId, page])
  const { data, error, failed } = useLoad(fetcher, { keepPrevious: true })

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className="text-gray-500 dark:text-gray-400">無法載入修改紀錄，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className="text-gray-500 dark:text-gray-400">載入中…</p>

  return (
    <div className="space-y-4">
      <div>
        <Link href={OPS_PATH} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-champagne">
          ← 營運
        </Link>
        <h1 className="mt-2 text-2xl font-serif">
          {data.channel.name} 的修改紀錄
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400">{healthStatusLabel(data.channel.state)}</p>
      </div>
      <AuditList data={data} onPage={setPage} />
    </div>
  )
}
