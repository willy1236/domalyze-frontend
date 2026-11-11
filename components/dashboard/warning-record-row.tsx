"use client"

import { useId, useState, type ReactNode } from "react"
import { WarningSheet } from "@/components/dashboard/warning-sheet"
import { formatDateTime } from "@/lib/dashboard-giveaways"
import { formatDuration, kindLabel, personLabel, type WarningRecord } from "@/lib/dashboard-warnings"

const muted = "text-gray-600 dark:text-gray-400"
const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 一筆紀錄：摘要列可展開成與 `/warning get` 相同的警告單；`actions` 是每列動作的插槽（W-03 放移除）。 */
export function WarningRecordRow({ record, actions }: { record: WarningRecord; actions?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const sheetId = useId()
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={sheetId}
          onClick={() => setOpen(!open)}
          className={`min-w-0 flex-1 basis-64 text-left rounded-sm ${focusRing}`}
        >
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`tabular-nums text-sm ${muted}`}>#{record.id}</span>
            <span className="inline-block rounded-sm border border-primary/40 dark:border-champagne/50 px-2 py-0.5 text-sm text-primary dark:text-champagne">
              {kindLabel(record.kind)}
              {record.duration_seconds !== null ? `・${formatDuration(record.duration_seconds)}` : ""}
            </span>
            {record.cross_guild && (
              <span className="inline-block rounded-sm border border-primary/20 dark:border-champagne/25 px-2 py-0.5 text-sm">
                跨群
              </span>
            )}
            {!record.this_guild && <span className={`text-sm ${muted}`}>其他伺服器發出</span>}
          </span>
          <span className="mt-1 block font-serif text-lg leading-snug text-primary dark:text-silver break-words">
            {personLabel(record.target)}
          </span>
          <span className={`block text-sm break-words ${muted}`}>{record.reason || "（沒有原因）"}</span>
          <span className={`block text-sm ${muted}`}>
            執行者：{personLabel(record.moderator)}
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{formatDateTime(record.created_at)}</span>
          </span>
        </button>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {open && <WarningSheet record={record} id={sheetId} />}
    </li>
  )
}
