"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Select } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { isNotBotOwner } from "@/lib/dashboard-ops"
import {
  type OpsGuild,
  commonMembersPath,
  fetchCommonMembers,
  fetchOpsDiscord,
  lookupPath,
} from "@/lib/dashboard-ops-discord"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

const muted = "text-gray-600 dark:text-gray-400"
const fmt = new Intl.NumberFormat("zh-TW")

function formatTime(iso: string | null): string {
  return iso === null ? "不明" : new Date(iso).toLocaleString("zh-TW")
}

function errorText(error: unknown): string {
  if (error instanceof DashboardApiError) {
    switch (error.code) {
      case "member_cache_loading":
        return "成員資料載入中，稍後再試"
      case "bot_unavailable":
        return "星羽目前離線"
      case "guild_not_found":
        return "星羽不在選擇的伺服器"
      case "same_guild":
        return "請選擇兩個不同的伺服器"
    }
  }
  return "無法載入，請稍後再試。"
}

function Members({ a, b, nameA, nameB }: { a: string; b: string; nameA: string; nameB: string }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchCommonMembers(a, b, signal), [a, b])
  const { data, error, failed } = useLoad(fetcher)

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className={muted}>{errorText(error)}</p>
  if (data === null) return <p className={muted}>載入中…</p>
  if (data.members.length === 0) return <p className="border border-champagne/30 px-4 py-8 text-center">沒有共通成員</p>

  return (
    <section className="space-y-3">
      <p className={`text-sm ${muted}`}>共 {fmt.format(data.members.length)} 位</p>
      <ul className="space-y-2">
        {data.members.map((member) => (
          <li key={member.id}>
            <Link
              href={lookupPath(member.id)}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-champagne/30 px-4 py-3 min-w-0 hover:bg-primary/5 dark:hover:bg-champagne/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.avatar_url} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate">{member.name}</p>
                <p className={`text-xs tabular-nums ${muted}`}>{member.id}</p>
              </div>
              <dl className={`grid grid-cols-[auto_1fr] gap-x-2 text-xs ${muted}`}>
                <dt className="truncate max-w-40">{nameA}</dt>
                <dd>{formatTime(member.joined_a)}</dd>
                <dt className="truncate max-w-40">{nameB}</dt>
                <dd>{formatTime(member.joined_b)}</dd>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function GuildSelect({
  label,
  value,
  guilds,
  onChange,
}: {
  label: string
  value: string
  guilds: OpsGuild[]
  onChange: (id: string) => void
}) {
  return (
    <label className="block min-w-0 flex-1 basis-56">
      <span className="block mb-1.5 text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {value === "" && <option value="">請選擇伺服器</option>}
        {/* 網址或主伺服器的 ID 不在星羽所在的伺服器裡時，照實顯示，不讓選單停在第一個選項 */}
        {value !== "" && !guilds.some((g) => g.id === value) && <option value={value}>{value}（星羽不在此伺服器）</option>}
        {guilds.map((guild) => (
          <option key={guild.id} value={guild.id}>
            {guild.name}
          </option>
        ))}
      </Select>
    </label>
  )
}

/** 兩個伺服器的共通成員；網址帶 ?a=&b=，b 省略時是主伺服器。 */
export function OpsCommonMembers() {
  const router = useRouter()
  const params = useSearchParams()
  const fetcher = useCallback((signal: AbortSignal) => fetchOpsDiscord(1, signal), [])
  const { data, error, failed } = useLoad(fetcher)

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className={muted}>無法載入，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className={muted}>載入中…</p>
  const live = data.live
  if (live === null) return <p className={muted}>星羽目前離線</p>

  const a = params.get("a") ?? ""
  const b = params.get("b") || live.main_guild_id || ""
  const names = new Map(live.guilds.map((g) => [g.id, g.name]))
  const select = (next: { a: string; b: string }) => router.replace(commonMembersPath(next.a, next.b || undefined))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <GuildSelect label="伺服器" value={a} guilds={live.guilds} onChange={(id) => select({ a: id, b })} />
        <GuildSelect label="對照伺服器" value={b} guilds={live.guilds} onChange={(id) => select({ a, b: id })} />
      </div>
      {a === "" || b === "" ? (
        <p className={muted}>請選擇兩個伺服器</p>
      ) : a === b ? (
        <p role="alert">請選擇兩個不同的伺服器</p>
      ) : (
        <Members a={a} b={b} nameA={names.get(a) ?? a} nameB={names.get(b) ?? b} />
      )}
    </div>
  )
}
