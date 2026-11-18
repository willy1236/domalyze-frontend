"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { buttonClass } from "@/components/ui/button-styles"
import {
  channelLabel,
  fetchPolls,
  formatDateTime,
  missingPermissionsText,
  pollHref,
  statusLabel,
  type PollSummary,
} from "@/lib/dashboard-polls"
import { sectionBasePath } from "@/lib/dashboard-sections"
import { useLoad } from "@/lib/use-load"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function Row({ guildId, poll }: { guildId: string; poll: PollSummary }) {
  const active = poll.status === "active"
  const creator = poll.creator_name ?? poll.creator_id
  const permissionWarning = missingPermissionsText(poll.missing_permissions)
  const time = active
    ? poll.deadline
      ? `截止：${formatDateTime(poll.deadline)}`
      : "沒有截止時間"
    : `結算：${poll.ended_at ? formatDateTime(poll.ended_at) : "—"}`
  return (
    <li>
      <Link
        href={pollHref(guildId, poll.id)}
        className={`w-full text-left py-4 grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_12rem] sm:items-center hover:bg-primary/5 dark:hover:bg-champagne/10 px-2 -mx-2 ${linkClass}`}
      >
        <span className="min-w-0">
          <span className="font-serif text-lg leading-snug text-primary dark:text-silver break-words">{poll.title}</span>
          <span className={`mt-0.5 block text-sm ${muted}`}>
            {creator}
            <span aria-hidden="true"> · </span>
            {channelLabel(poll)}
          </span>
          {permissionWarning && (
            <span
              title={permissionWarning.full}
              className="mt-0.5 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300"
            >
              <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
              <span className="break-words">{permissionWarning.short}</span>
            </span>
          )}
        </span>
        <span className="text-sm">
          <span
            className={`inline-block rounded-sm border px-2 py-0.5 ${
              active
                ? "border-primary/40 dark:border-champagne/50 text-primary dark:text-champagne"
                : "border-primary/20 dark:border-champagne/25"
            }`}
          >
            {statusLabel(poll.status)}
          </span>
        </span>
        <span className="text-sm tabular-nums">{poll.voter_count} 人投票</span>
        <span className="text-sm tabular-nums">{time}</span>
      </Link>
    </li>
  )
}

/** 投票清單：進行中的在最上面（只在第 1 頁），已結算依結算時間由新到舊。 */
export function PollList({ guildId }: { guildId: string }) {
  const [all, setAll] = useState(false)
  const [page, setPage] = useState(1)
  const fetcher = useCallback((signal: AbortSignal) => fetchPolls(guildId, { all, page }, signal), [guildId, all, page])
  const { data, failed, loading, reload } = useLoad(fetcher, { keepPrevious: true })

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">投票</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) => {
                setAll(e.target.checked)
                setPage(1)
              }}
            />
            顯示全部{data && !all ? `（目前只列 ${data.recent_days} 天內建立的）` : ""}
          </label>
          <Button type="button" size="sm" disabled={loading} onClick={() => void reload()}>
            重新整理
          </Button>
          <Link href={`${sectionBasePath(guildId)}/polls/new`} className={buttonClass("outline", "sm")}>
            發起投票
          </Link>
        </div>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入投票，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void reload()}>
            重試
          </button>
          。
        </p>
      )}
      {data === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {data &&
        (data.polls.length === 0 && page === 1 ? (
          <p className={`py-8 ${muted}`}>
            目前沒有投票。成員在伺服器使用 <code>/poll create</code> 發起投票後，會列在這裡。
          </p>
        ) : (
          <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
            {data.polls.map((p) => (
              <Row key={p.id} guildId={guildId} poll={p} />
            ))}
          </ul>
        ))}

      {data && (page > 1 || data.has_next) && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Button type="button" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            上一頁
          </Button>
          <span className="tabular-nums">第 {page} 頁</span>
          <Button type="button" size="sm" disabled={!data.has_next || loading} onClick={() => setPage(page + 1)}>
            下一頁
          </Button>
        </div>
      )}
    </section>
  )
}
