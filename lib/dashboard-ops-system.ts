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

export type RunResult = "success" | "error" | "missed" | "skipped"

export interface SystemJob {
  id: string
  name: string
  /** 後端轉好的觸發規則，例如「每 3 分鐘」「每天 00:00」 */
  trigger: string
  /** 暫停中為 null */
  next_run_at: string | null
  /** 啟動後還沒執行過為 null */
  last: {
    at: string
    result: RunResult
    /** 只有成功與失敗有耗時 */
    duration_ms: number | null
    /** 失敗時的錯誤訊息與 traceback */
    error: string | null
  } | null
}

/** running 為 false：排程未啟動；running 為 true 但 jobs 為空：此環境不註冊週期任務。jobs 已把最近一次不是成功的排在前面 */
export type SystemJobs = { state: "up"; running: boolean; jobs: SystemJob[] } | Unavailable

export function fetchSystemJobs(signal?: AbortSignal): Promise<SystemJobs> {
  return dashboardFetch("/dashboard/ops/system/jobs", {}, { signal })
}

export const RUN_RESULT_LABEL: Record<RunResult, string> = {
  success: "成功",
  error: "失敗",
  missed: "錯過",
  skipped: "上一次還沒跑完而略過",
}

/** 最近一次執行不是成功（還沒執行過不算） */
export function isProblem(job: SystemJob): boolean {
  return job.last !== null && job.last.result !== "success"
}

/** 耗時：不到 1 秒顯示毫秒，否則顯示到小數一位的秒數 */
export function formatDurationMs(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} 秒`
}
