"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { EnforcementEntryView } from "@/components/dashboard/channel/enforcement-entry"
import { ENFORCEMENT_PAGE_SIZE, fetchOpsEnforcement } from "@/lib/dashboard-enforcement"
import { isNotBotOwner } from "@/lib/dashboard-ops"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

/** 某頻道最近 30 天的執法紀錄，營運入口只讀，不提供處置。 */
export function OpsEnforcementList({ channelId }: { channelId: string }) {
  const [offset, setOffset] = useState(0)
  const fetcher = useCallback((signal: AbortSignal) => fetchOpsEnforcement(channelId, offset, signal), [channelId, offset])
  const { data, error, failed } = useLoad(fetcher, { keepPrevious: true })

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className="text-gray-500 dark:text-gray-400">無法載入執法紀錄，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className="text-gray-500 dark:text-gray-400">載入中…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif">執法紀錄</h2>
      {data.entries.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">最近 30 天沒有執法紀錄</p>
      ) : (
        <ul className="space-y-3">
          {data.entries.map((entry) => (
            <EnforcementEntryView key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
      {(offset > 0 || data.has_next) && (
        <nav aria-label="執法紀錄分頁" className="flex items-center gap-3">
          <Button type="button" size="sm" disabled={offset <= 0} onClick={() => setOffset(Math.max(0, offset - ENFORCEMENT_PAGE_SIZE))}>
            上一頁
          </Button>
          <span className="text-sm tabular-nums">第 {offset / ENFORCEMENT_PAGE_SIZE + 1} 頁</span>
          <Button type="button" size="sm" disabled={!data.has_next} onClick={() => setOffset(offset + ENFORCEMENT_PAGE_SIZE)}>
            下一頁
          </Button>
        </nav>
      )}
    </div>
  )
}
