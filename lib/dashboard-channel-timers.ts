// 頻道後台的計時訊息：資料型別、寫入 API，以及表單與衝突提示用的轉換。對應後端 channel_timers.py。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export const MESSAGE_MAX = 500
export const INTERVAL_MIN = 5
export const INTERVAL_MAX = 1440
export const MIN_LINES_MAX = 1000
/** 每個頻道最多幾則計時訊息，和後端 twitch_timers.TIMERS_MAX 一致 */
export const TIMERS_MAX = 20

/** 訊息內容可用的變數；計時訊息沒有觸發者，不提供 {user}、{touser}、{args}、{count}。不認得的變數會原樣送出 */
export const TIMER_VARIABLES: { token: string; description: string }[] = [
  { token: "{channel}", description: "頻道名稱" },
  { token: "{uptime}", description: "已開台時間" },
  { token: "{game}", description: "目前分類" },
  { token: "{title}", description: "目前標題" },
]

/** 表單可編輯的欄位，也是 PUT／DELETE 的 original */
export interface TimerValues {
  message: string
  interval_minutes: number
  min_chat_lines: number
  enabled: boolean
}

export interface ChannelTimer extends TimerValues {
  id: number
  updated_at: string
}

export const EMPTY_TIMER: TimerValues = {
  message: "",
  interval_minutes: 30,
  min_chat_lines: 0,
  enabled: true,
}

/** 只取可編輯的欄位，id 與更新時間不放進 original */
export function valuesOf(timer: ChannelTimer | TimerValues): TimerValues {
  return {
    message: timer.message,
    interval_minutes: timer.interval_minutes,
    min_chat_lines: timer.min_chat_lines,
    enabled: timer.enabled,
  }
}

const base = (channelId: string) => `/dashboard/channels/${encodeURIComponent(channelId)}/timers`

export function fetchTimers(channelId: string, signal?: AbortSignal): Promise<{ timers: ChannelTimer[] }> {
  return dashboardFetch(base(channelId), {}, { signal })
}

export function createTimer(channelId: string, values: TimerValues): Promise<{ timer: ChannelTimer }> {
  return dashboardFetch(base(channelId), { method: "POST", json: values })
}

export function saveTimer(
  channelId: string,
  id: number,
  values: TimerValues,
  original: TimerValues,
): Promise<{ timer: ChannelTimer }> {
  return dashboardFetch(`${base(channelId)}/${id}`, { method: "PUT", json: { values, original } })
}

export function deleteTimer(channelId: string, id: number, original: TimerValues): Promise<void> {
  return dashboardFetch(`${base(channelId)}/${id}`, { method: "DELETE", json: { original } })
}

/** 衝突提示用的字串形式，和後端 twitch_timers.comparable 一致 */
export type ConflictValues = Record<string, string | null>

export function toConflictValues(values: TimerValues): ConflictValues {
  return {
    message: values.message,
    interval_minutes: String(values.interval_minutes),
    min_chat_lines: String(values.min_chat_lines),
    enabled: values.enabled ? "true" : "false",
  }
}

/** 409 回傳的最新值轉回表單的值，「以我的內容覆蓋」時當新的原始值 */
export function fromConflictValues(current: ConflictValues): TimerValues {
  return {
    message: current.message ?? "",
    interval_minutes: Number(current.interval_minutes ?? EMPTY_TIMER.interval_minutes),
    min_chat_lines: Number(current.min_chat_lines ?? 0),
    enabled: current.enabled === "true",
  }
}

/** 衝突提示裡欄位值的顯示文字 */
export function formatConflictField(field: string, value: string | null): string {
  if (value === null || value === "") return "無"
  switch (field) {
    case "enabled":
      return value === "true" ? "開啟" : "關閉"
    case "interval_minutes":
      return `${value} 分鐘`
    case "min_chat_lines":
      return `${value} 則`
    default:
      return value
  }
}

/** 後端 409 / 400 / 422 / 503 的回應拆成表單好處理的形狀；其他錯誤回 null。 */
export type SaveProblem =
  | { kind: "conflict"; deleted: boolean; current: ConflictValues | null }
  | { kind: "invalid_field"; field: string; reason: string }
  | { kind: "automod_blocked" }
  | { kind: "automod_unavailable" }
  | { kind: "not_enabled" }

export function parseSaveProblem(e: unknown): SaveProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  const body = (e.body ?? {}) as { deleted?: boolean; current?: ConflictValues | null; field?: string; reason?: string }
  switch (e.code) {
    case "conflict":
      return { kind: "conflict", deleted: body.deleted === true, current: body.current ?? null }
    case "invalid_field":
      return body.field && body.reason ? { kind: "invalid_field", field: body.field, reason: body.reason } : null
    case "automod_blocked":
      return { kind: "automod_blocked" }
    case "automod_unavailable":
      return { kind: "automod_unavailable" }
    case "channel_not_enabled":
      return { kind: "not_enabled" }
    default:
      return null
  }
}

/** 清單每列的一行摘要：間隔與最少聊天量 */
export function timerSummary(timer: TimerValues): string {
  const parts = [`每 ${timer.interval_minutes} 分鐘`]
  parts.push(timer.min_chat_lines > 0 ? `至少 ${timer.min_chat_lines} 則聊天` : "不限聊天量")
  return parts.join(" · ")
}

/** 是否已達每個頻道的計時訊息上限；達到後不能再新增 */
export function atTimerLimit(count: number): boolean {
  return count >= TIMERS_MAX
}
