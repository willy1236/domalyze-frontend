"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { isNotBotOwner } from "@/lib/dashboard-ops"
import {
  type GuildEvent,
  type OpsGuild,
  RANGES,
  fetchGuildEvents,
  fetchOpsDiscord,
  guildEventLabel,
} from "@/lib/dashboard-ops-discord"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"
import { TrendChart } from "./trend-chart"

const muted = "text-gray-600 dark:text-gray-400"
const fmt = new Intl.NumberFormat("zh-TW")

function formatTime(iso: string | null): string {
  return iso === null ? "不明" : new Date(iso).toLocaleString("zh-TW")
}

function GuildIcon({ guild }: { guild: { name: string; icon_url: string | null } }) {
  if (guild.icon_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={guild.icon_url} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full" />
  }
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-champagne/15 text-sm">
      {guild.name.slice(0, 1)}
    </span>
  )
}

function Trends() {
  const [days, setDays] = useState<number>(RANGES[2].days)
  const fetcher = useCallback((signal: AbortSignal) => fetchOpsDiscord(days, signal), [days])
  const { data, error, failed } = useLoad(fetcher, { keepPrevious: true })

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className={muted}>無法載入，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className={muted}>載入中…</p>

  const live = data.live
  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${muted}`}>
            {live ? `目前 ${fmt.format(live.guild_count)} 個伺服器・${fmt.format(live.user_count)} 位使用者` : "星羽目前離線"}
          </p>
          <div role="group" aria-label="期間" className="flex gap-1">
            {RANGES.map((range) => (
              <Button
                key={range.days}
                type="button"
                size="sm"
                aria-pressed={days === range.days}
                className="aria-pressed:bg-champagne aria-pressed:text-background-dark"
                onClick={() => setDays(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <TrendChart title="伺服器數" points={data.daily.map((d) => ({ date: d.date, value: d.servers }))} />
          <TrendChart title="使用者數" points={data.daily.map((d) => ({ date: d.date, value: d.users }))} />
        </div>
      </div>
      {live && <GuildList guilds={live.guilds} />}
    </>
  )
}

function GuildList({ guilds }: { guilds: OpsGuild[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-serif">所在伺服器</h2>
      {guilds.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">還沒有加入任何伺服器</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {guilds.map((guild) => (
            <li key={guild.id} className="flex items-center gap-3 border border-champagne/30 px-4 py-3 min-w-0">
              <GuildIcon guild={guild} />
              <div className="min-w-0">
                <p className="truncate">{guild.name}</p>
                <p className={`text-xs ${muted}`}>
                  {guild.member_count === null ? "" : `${fmt.format(guild.member_count)} 位成員・`}
                  加入於 {formatTime(guild.joined_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EventRow({ event }: { event: GuildEvent }) {
  const name = event.guild_name ?? event.guild_id
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border border-champagne/30 px-4 py-3 min-w-0">
      <p className="min-w-0">
        <span className={event.event === "join" ? "" : muted}>{guildEventLabel(event)}</span>・{name}
        {event.member_count !== null && <span className={`text-xs ${muted}`}>（{fmt.format(event.member_count)} 位成員）</span>}
      </p>
      <time dateTime={event.at} className={`text-xs ${muted}`}>
        {formatTime(event.at)}
      </time>
    </li>
  )
}

function Events() {
  const [page, setPage] = useState(1)
  const fetcher = useCallback((signal: AbortSignal) => fetchGuildEvents(page, signal), [page])
  const { data, failed } = useLoad(fetcher, { keepPrevious: true })

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-serif">加入離開紀錄</h2>
      {failed ? (
        <p className={muted}>無法載入紀錄，請稍後重新整理頁面再試。</p>
      ) : data === null ? (
        <p className={muted}>載入中…</p>
      ) : data.events.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">還沒有紀錄</p>
      ) : (
        <ul className="space-y-2">
          {data.events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
      {data && (page > 1 || data.has_next) && (
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
    </section>
  )
}

/** 營運入口的 Discord 分頁：人數趨勢、所在伺服器、加入離開紀錄。 */
export function OpsDiscord() {
  return (
    <div className="space-y-8">
      <Trends />
      <Events />
    </div>
  )
}
