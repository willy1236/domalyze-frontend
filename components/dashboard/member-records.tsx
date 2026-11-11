"use client"

import { useCallback } from "react"
import { WarningRecordRow } from "@/components/dashboard/warning-record-row"
import { DashboardApiError } from "@/lib/dashboard-api"
import { fetchMemberRecords, memberErrorText, personLabel } from "@/lib/dashboard-warnings"
import { useLoad } from "@/lib/use-load"

const muted = "text-gray-600 dark:text-gray-400"

/** 成員的跨群紀錄：他在所有伺服器存入跨群系統的紀錄，加上本伺服器只在本伺服器的紀錄（同 `/warning list`）。 */
export function MemberRecords({ guildId, userId, onClose }: { guildId: string; userId: string; onClose: () => void }) {
  const fetcher = useCallback(
    (signal: AbortSignal) => fetchMemberRecords(guildId, userId, signal),
    [guildId, userId],
  )
  const { data, error: loadError } = useLoad(fetcher)
  const error = loadError ? memberErrorText(loadError instanceof DashboardApiError ? loadError.code : null) : null

  return (
    <section aria-label="成員的跨群紀錄" className="mt-4 rounded-md border border-primary/20 dark:border-champagne/25 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl text-primary dark:text-silver">
          {data ? `${personLabel(data.member)} 的跨群紀錄` : "跨群紀錄"}
        </h3>
        <button type="button" className="text-sm underline" onClick={onClose}>
          關閉
        </button>
      </header>
      {error && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {!data && !error && <p className={`mt-3 text-sm ${muted}`}>載入中…</p>}
      {data &&
        (data.warnings.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>這位成員沒有跨群紀錄，也沒有在本伺服器的紀錄。</p>
        ) : (
          <ul className="mt-2 divide-y divide-primary/10 dark:divide-champagne/10">
            {data.warnings.map((w) => (
              <WarningRecordRow key={w.id} record={w} />
            ))}
          </ul>
        ))}
    </section>
  )
}
