"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { participantLabel } from "@/lib/dashboard-giveaways"
import { formatVoiceMinutes } from "@/lib/dashboard-records"
import {
  VOICE_RANKING_PAGE_SIZE,
  type VoiceRankingRow,
  fetchVoiceRanking,
  voiceRankingErrorText,
} from "@/lib/dashboard-voice-ranking"
import { useLoad } from "@/lib/use-load"

const mutedClass = "text-gray-500 dark:text-gray-400"

function RankRow({ row, mine }: { row: VoiceRankingRow; mine: boolean }) {
  return (
    <li className={`flex items-center gap-3 py-2 ${mine ? "text-champagne" : ""}`}>
      <span className={`w-10 shrink-0 text-right tabular-nums ${mine ? "" : mutedClass}`}>{row.rank}</span>
      <span className="inline-flex items-center gap-2 min-w-0 flex-1">
        {row.member.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.member.avatar_url} alt="" width={20} height={20} className="w-5 h-5 rounded-full shrink-0" />
        )}
        <span className={`break-all ${row.member.left ? mutedClass : ""}`}>{participantLabel(row.member)}</span>
      </span>
      <span className="shrink-0 tabular-nums">{formatVoiceMinutes(row.minutes)}</span>
    </li>
  )
}

/** 伺服器的完整語音排行，分頁顯示，自己的名次固定列在上方 */
export function VoiceRanking({ guildId }: { guildId: string }) {
  const [page, setPage] = useState(0)
  const fetcher = useCallback(
    (signal: AbortSignal) => fetchVoiceRanking(guildId, page * VOICE_RANKING_PAGE_SIZE, signal),
    [guildId, page],
  )
  const { data, error, failed, loading } = useLoad(fetcher, { keepPrevious: true })
  const pages = data ? Math.max(1, Math.ceil(data.total / VOICE_RANKING_PAGE_SIZE)) : 1

  return (
    <section className="grid gap-6">
      <div>
        <Link href="/dashboard" className={`text-sm ${mutedClass} hover:text-champagne`}>
          ← 我的
        </Link>
        <h1 className="mt-2 text-2xl font-serif break-words">{data ? `${data.guild_name} 語音時數排行` : "語音時數排行"}</h1>
      </div>
      {failed && (
        <p className={mutedClass}>{voiceRankingErrorText(error instanceof DashboardApiError ? error.code : null)}</p>
      )}
      {!data && !failed && <p className={mutedClass}>載入中…</p>}
      {data && data.total === 0 && <p className={mutedClass}>這個伺服器還沒有語音時數紀錄。</p>}
      {data && data.total > 0 && (
        <>
          {data.mine.length > 0 && (
            <ol className="border border-champagne/30 px-4 divide-y divide-champagne/15">
              {data.mine.map((row) => (
                <RankRow key={row.member.id} row={row} mine />
              ))}
            </ol>
          )}
          <ol className={`divide-y divide-primary/10 dark:divide-champagne/15 ${loading ? "opacity-60" : ""}`}>
            {data.items.map((row) => (
              <RankRow key={row.member.id} row={row} mine={row.mine} />
            ))}
          </ol>
          {pages > 1 && (
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" disabled={loading || page === 0} onClick={() => setPage(page - 1)}>
                上一頁
              </Button>
              <span className={`text-sm tabular-nums ${mutedClass}`}>
                {page + 1} / {pages}
              </span>
              <Button type="button" size="sm" disabled={loading || page + 1 >= pages} onClick={() => setPage(page + 1)}>
                下一頁
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
