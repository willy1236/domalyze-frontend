"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { type AuditEntry, OPS_PATH, auditLabels, fetchOpsAudit, isNotBotOwner } from "@/lib/dashboard-ops"
import { healthStatusLabel } from "@/lib/dashboard-channel-health"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

function Snapshot({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <pre className="text-xs whitespace-pre-wrap break-words">{value === null ? "（無）" : JSON.stringify(value, null, 2)}</pre>
    </div>
  )
}

export function AuditRow({ entry }: { entry: AuditEntry }) {
  const labels = auditLabels(entry)
  return (
    <li className="border border-champagne/30 px-4 py-3 space-y-2 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p>
          {labels.action}・{labels.target}
        </p>
        <time dateTime={entry.at} className="text-xs text-gray-600 dark:text-gray-400">
          {new Date(entry.at).toLocaleString("zh-TW")}
        </time>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        操作者：{labels.actor}・來源：{labels.source}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Snapshot label="修改前" value={entry.before} />
        <Snapshot label="修改後" value={entry.after} />
      </div>
    </li>
  )
}

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
      {data.entries.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">還沒有修改紀錄</p>
      ) : (
        <ul className="space-y-3">
          {data.entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
      {(page > 1 || data.has_next) && (
        <nav aria-label="分頁" className="flex items-center gap-3">
          <Button type="button" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一頁
          </Button>
          <span className="text-sm tabular-nums">第 {page} 頁</span>
          <Button type="button" size="sm" disabled={!data.has_next} onClick={() => setPage(page + 1)}>
            下一頁
          </Button>
        </nav>
      )}
    </div>
  )
}
