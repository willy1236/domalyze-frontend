"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui"
import {
  fetchGiveaways,
  formatDateTime,
  missingPermissionsText,
  statusLabel,
  type GiveawaySummary,
  type GiveawaysResponse,
} from "@/lib/dashboard-giveaways"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function Row({ giveaway, onSelect }: { giveaway: GiveawaySummary; onSelect: (id: number) => void }) {
  const active = giveaway.status === "active"
  const creator = giveaway.creator_name ?? giveaway.creator_id
  const channel = giveaway.channel_name ? `#${giveaway.channel_name}` : "頻道已不存在"
  const permissionWarning = missingPermissionsText(giveaway.missing_permissions)
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(giveaway.id)}
        className={`w-full text-left py-4 grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,1fr)_6rem_9rem_11rem] sm:items-center hover:bg-primary/5 dark:hover:bg-champagne/10 px-2 -mx-2 ${linkClass}`}
      >
        <span className="min-w-0">
          <span className="font-serif text-lg leading-snug text-primary dark:text-silver break-words">{giveaway.prize_name}</span>
          <span className={`mt-0.5 block text-sm ${muted}`}>
            {creator}
            <span aria-hidden="true"> · </span>
            {channel}
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
            {statusLabel(giveaway.status)}
          </span>
        </span>
        <span className="text-sm tabular-nums">
          <span className={`sm:hidden ${muted}`}>參加：</span>
          {giveaway.participant_count} 人 / 抽 {giveaway.winner_count} 人
        </span>
        <span className="text-sm tabular-nums">
          <span className={muted}>{active ? "預計開獎：" : "結束："}</span>
          {giveaway.ends_at ? formatDateTime(giveaway.ends_at) : "—"}
        </span>
      </button>
    </li>
  )
}

/** 抽獎清單：進行中的在最上面（只在第 1 頁），已結束依結束時間由新到舊；進入頁面時載入，另有手動重新整理。 */
export function GiveawayList({ guildId, onSelect }: { guildId: string; onSelect: (id: number) => void }) {
  const [all, setAll] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<GiveawaysResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      setLoading(true)
      try {
        setData(await fetchGiveaways(guildId, { all, page }, signal))
      } catch (e) {
        if (signal?.aborted) return
        console.error("load giveaways failed", e)
        setFailed(true)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [guildId, all, page],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">抽獎</h2>
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
          <Button type="button" size="sm" disabled={loading} onClick={() => void load()}>
            重新整理
          </Button>
        </div>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入抽獎，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}
      {data === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {data &&
        (data.giveaways.length === 0 && page === 1 ? (
          <p className={`py-8 ${muted}`}>
            目前沒有抽獎。成員在伺服器使用 <code>/giveaway create</code> 發起抽獎後，會列在這裡。
          </p>
        ) : (
          <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
            {data.giveaways.map((g) => (
              <Row key={g.id} giveaway={g} onSelect={onSelect} />
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
