"use client"

import { useEffect, type ReactNode } from "react"
import { isNotBotOwner } from "@/lib/dashboard-ops"
import {
  SYSTEM_REFRESH_MS,
  type SystemStatus,
  type Tone,
  busLabel,
  fetchSystemStatus,
  formatUptime,
  stateLabel,
} from "@/lib/dashboard-ops-system"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

const muted = "text-gray-600 dark:text-gray-400"
const fmt = new Intl.NumberFormat("zh-TW")

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-emerald-700 dark:text-emerald-400",
  warn: "text-amber-700 dark:text-amber-400",
  down: "text-red-600 dark:text-red-400",
  error: "text-gray-600 dark:text-gray-400",
}

/** 狀態與取得時間一起回傳，經過時間以取得時為準，render 期間不讀時鐘 */
async function load(signal: AbortSignal): Promise<{ status: SystemStatus; at: number }> {
  const status = await fetchSystemStatus(signal)
  return { status, at: Date.now() }
}

/** 每隔 interval 呼叫一次 reload；分頁在背景時瀏覽器會自行放慢計時器。 */
function useInterval(reload: () => Promise<void>, interval: number) {
  useEffect(() => {
    const id = setInterval(() => void reload(), interval)
    return () => clearInterval(id)
  }, [reload, interval])
}

function Badge({ label }: { label: { text: string; tone: Tone } }) {
  return <span className={`text-sm shrink-0 ${TONE_CLASS[label.tone]}`}>{label.text}</span>
}

function Card({ title, label, children }: { title: string; label: { text: string; tone: Tone }; children?: ReactNode }) {
  return (
    <section className="border border-champagne/30 px-4 py-3 space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif">{title}</h3>
        <Badge label={label} />
      </div>
      {children && <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm tabular-nums">{children}</dl>}
    </section>
  )
}

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      <dt className={muted}>{name}</dt>
      <dd className="text-right min-w-0 truncate">{children}</dd>
    </>
  )
}

function DiscordCard({ status, at }: { status: SystemStatus["discord"]; at: number }) {
  if (status.state !== "up") return <Card title="Discord bot" label={stateLabel(status.state)} />
  const label = status.ready ? stateLabel("up") : { text: "未就緒", tone: "warn" as const }
  return (
    <Card title="Discord bot" label={label}>
      <Row name="Gateway latency">{status.latency_ms === null ? "不明" : `${fmt.format(status.latency_ms)} ms`}</Row>
      <Row name="啟動以來">{formatUptime(status.started_at, at)}</Row>
      <Row name="伺服器數">{fmt.format(status.guild_count)}</Row>
      <Row name="成員快取">
        {status.unchunked_guilds === 0 ? "全部載完" : `還剩 ${fmt.format(status.unchunked_guilds)} 個伺服器`}
      </Row>
    </Card>
  )
}

function TwitchCard({ status, at }: { status: SystemStatus["twitch"]; at: number }) {
  if (status.state !== "up") return <Card title="Twitch bot" label={stateLabel(status.state)} />
  return (
    <Card title="Twitch bot" label={stateLabel("up")}>
      <Row name="啟動以來">{formatUptime(status.started_at, at)}</Row>
      <Row name="已加入聊天室">{fmt.format(status.rooms)}</Row>
    </Card>
  )
}

function DbCard({ status }: { status: SystemStatus["db"] }) {
  if (status.state !== "up") return <Card title="後台 DB" label={stateLabel(status.state)} />
  const { executor, pool } = status
  return (
    <Card title="後台 DB" label={stateLabel("up")}>
      <Row name="Executor 執行中">
        {executor.busy} / {executor.workers}
      </Row>
      <Row name="Executor 排隊中">{fmt.format(executor.queued)}</Row>
      <Row name="連線池使用中">
        {pool.in_use} / {pool.limit}
      </Row>
    </Card>
  )
}

/** 營運入口的系統分頁：各 process 與服務的運行狀態，每 30 秒自動更新。 */
export function OpsSystem() {
  const { data, error, failed, reload } = useLoad(load)
  useInterval(reload, SYSTEM_REFRESH_MS)

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (data === null) return <p className={muted}>{failed ? "無法載入，稍後會自動重試。" : "載入中…"}</p>

  const { status, at } = data
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-serif">運行狀態</h2>
        <p className={`text-xs ${muted}`}>
          {failed ? "更新失敗，顯示的是上次的結果・" : ""}
          {new Date(at).toLocaleTimeString("zh-TW", { hour12: false })} 更新
        </p>
      </div>
      <SystemCards status={status} at={at} />
    </section>
  )
}

/** 四個區塊各自依自己的 state 顯示，一區取不到不影響其他區。at 是取得狀態的時間（毫秒）。 */
export function SystemCards({ status, at }: { status: SystemStatus; at: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DiscordCard status={status.discord} at={at} />
      <TwitchCard status={status.twitch} at={at} />
      <Card title="訊息匯流排" label={busLabel(status.bus.state)} />
      <DbCard status={status.db} />
    </div>
  )
}
