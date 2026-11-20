// bot owner 營運入口的系統部分：Discord bot、Twitch bot、訊息匯流排與後台 DB 的運行狀態。

import { dashboardFetch } from "./dashboard-api"

export const OPS_SYSTEM_PATH = "/dashboard/ops/system"

/** 每隔多久自動更新 */
export const SYSTEM_REFRESH_MS = 30_000

/** down：確定沒在跑；error：取資料時出錯 */
type Unavailable = { state: "down" } | { state: "error" }

export type DiscordStatus =
  | {
      state: "up"
      ready: boolean
      /** 還沒量到或量不到時為 null */
      latency_ms: number | null
      /** 第一次就緒的時間，還沒就緒過為 null */
      started_at: string | null
      guild_count: number
      /** 成員快取還沒載完的伺服器數 */
      unchunked_guilds: number
    }
  | Unavailable

export type TwitchStatus = { state: "up"; started_at: string | null; rooms: number } | Unavailable

export type BusStatus = { state: "up" | "down" | "unconfigured" | "error" }

export type DbStatus =
  | {
      state: "up"
      executor: { workers: number; busy: number; queued: number }
      pool: { in_use: number; limit: number }
    }
  | { state: "error" }

export interface SystemStatus {
  discord: DiscordStatus
  twitch: TwitchStatus
  bus: BusStatus
  db: DbStatus
}

export function fetchSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  return dashboardFetch("/dashboard/ops/system/status", {}, { signal })
}

export type Tone = "ok" | "warn" | "down" | "error"

/** 狀態標示：正常、離線、無法取得一致；匯流排與未就緒另有文字。 */
export function stateLabel(state: string): { text: string; tone: Tone } {
  switch (state) {
    case "up":
      return { text: "正常", tone: "ok" }
    case "down":
      return { text: "離線", tone: "down" }
    case "unconfigured":
      return { text: "未設定 Redis", tone: "warn" }
    default:
      return { text: "無法取得", tone: "error" }
  }
}

export function busLabel(state: BusStatus["state"]): { text: string; tone: Tone } {
  if (state === "up") return { text: "已連線", tone: "ok" }
  if (state === "down") return { text: "斷線", tone: "down" }
  return stateLabel(state)
}

/** 從 started_at 到 now 的經過時間，例如「3 天 4 小時」「12 分鐘」；null 顯示「不明」。 */
export function formatUptime(startedAt: string | null, now: number): string {
  if (startedAt === null) return "不明"
  const minutes = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days} 天 ${hours} 小時`
  if (hours > 0) return `${hours} 小時 ${mins} 分鐘`
  return `${mins} 分鐘`
}
