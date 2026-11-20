"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { isNotBotOwner } from "@/lib/dashboard-ops"
import { WEEK_RANGES, fetchWebsiteWeeks, formatRate } from "@/lib/dashboard-ops-website"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

const muted = "text-gray-600 dark:text-gray-400"

/** 營運入口的網站分頁：每週使用網站的 Discord 帳號中已連結析域帳號的比例，與連結入口的點擊次數。 */
export function OpsWebsite() {
  const [weeks, setWeeks] = useState<number>(WEEK_RANGES[0])
  const fetcher = useCallback((signal: AbortSignal) => fetchWebsiteWeeks(weeks, signal), [weeks])
  const { data, error, failed } = useLoad(fetcher, { keepPrevious: true })

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className={muted}>無法載入，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className={muted}>載入中…</p>

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-serif">析域帳號連結率</h2>
        <div role="group" aria-label="期間" className="flex gap-1">
          {WEEK_RANGES.map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              aria-pressed={weeks === n}
              className="aria-pressed:bg-champagne aria-pressed:text-background-dark"
              onClick={() => setWeeks(n)}
            >
              {n} 週
            </Button>
          ))}
        </div>
      </div>
      {data.weeks.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">這段期間沒有紀錄</p>
      ) : (
        <div className="overflow-x-auto border border-champagne/30">
          <table className="w-full text-sm tabular-nums">
            <thead className={`text-left ${muted}`}>
              <tr>
                <th className="px-4 py-2 font-normal">週（週一起）</th>
                <th className="px-4 py-2 font-normal text-right">使用帳號</th>
                <th className="px-4 py-2 font-normal text-right">已連結</th>
                <th className="px-4 py-2 font-normal text-right">連結率</th>
                <th className="px-4 py-2 font-normal text-right">入口點擊</th>
              </tr>
            </thead>
            <tbody>
              {data.weeks.map((week) => (
                <tr key={week.week_start} className="border-t border-champagne/20">
                  <td className="px-4 py-2 whitespace-nowrap">{week.week_start}</td>
                  <td className="px-4 py-2 text-right">{week.accounts}</td>
                  <td className="px-4 py-2 text-right">{week.linked}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {formatRate(week)}
                    {week.pending > 0 && <span className={`ml-1 text-xs ${muted}`}>{week.pending} 待結算</span>}
                  </td>
                  <td className="px-4 py-2 text-right">{week.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
