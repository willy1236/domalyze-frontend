import type { ReactNode } from "react"
import { type EnforcementEntry, enforcementActionLabel, enforcementFilterLabel } from "@/lib/dashboard-enforcement"

/** 一筆執法紀錄：時間、觀眾、過濾器、第幾次、動作與原訊息；頻道後台與營運入口共用，處置按鈕由 children 放進來。 */
export function EnforcementEntryView({ entry, children }: { entry: EnforcementEntry; children?: ReactNode }) {
  return (
    <li className="min-w-0 space-y-2 border border-champagne/30 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p>
          <span className="font-medium">{entry.user_name}</span>{" "}
          <span className="text-sm text-gray-500 dark:text-gray-400">@{entry.user_login}</span>
        </p>
        <time dateTime={entry.at} className="text-xs text-gray-600 dark:text-gray-400">
          {new Date(entry.at).toLocaleString("zh-TW")}
        </time>
      </div>
      <p className="text-sm">
        {enforcementFilterLabel(entry.filter)}・第 {entry.strike} 次・{enforcementActionLabel(entry)}
        {entry.status === "failed" && <span className="ml-2 text-red-700 dark:text-red-300">執法失敗</span>}
        {entry.lifted_at !== null && <span className="ml-2 text-gray-600 dark:text-gray-400">已解除</span>}
      </p>
      <p className="break-words text-sm text-gray-600 dark:text-gray-400">{entry.message}</p>
      {children}
    </li>
  )
}
