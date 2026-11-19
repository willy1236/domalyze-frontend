// 頻道後台的事件回應：資料型別、API，以及表單與衝突提示用的轉換。對應後端 channel_event_responses.py。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export const TEMPLATE_MAX = 500

export interface EventVariable {
  token: string
  description: string
}

export interface EventResponse {
  kind: string
  enabled: boolean
  template: string
  /** 沒有自訂過，正在使用預設文字 */
  is_default: boolean
  variables: EventVariable[]
}

/** 表單可編輯的欄位，也是 PUT／DELETE 的 original（含預設值，衝突以有效值比對） */
export interface EventValues {
  enabled: boolean
  template: string
}

/** 後端 EventSub 事件種類的顯示名稱與補充說明，順序同後端 */
export const EVENT_KINDS: { kind: string; label: string; note?: string }[] = [
  { kind: "stream_online", label: "開台" },
  { kind: "follow", label: "追隨", note: "同一個頻道 10 秒內只感謝第一位追隨者。" },
  { kind: "subscribe", label: "訂閱" },
  { kind: "resubscribe", label: "續訂", note: "觀眾發出續訂訊息時才會回應。" },
  { kind: "gift", label: "贈訂", note: "一次贈送多份只回應一次；匿名贈訂的名稱是「匿名」。" },
  { kind: "raid", label: "Raid" },
]

export function eventMeta(kind: string) {
  return EVENT_KINDS.find((e) => e.kind === kind) ?? { kind, label: kind }
}

export function valuesOf(response: EventValues): EventValues {
  return { enabled: response.enabled, template: response.template }
}

export function isDirty(base: EventValues, draft: EventValues): boolean {
  return base.enabled !== draft.enabled || base.template !== draft.template
}

const base = (channelId: string) => `/dashboard/channels/${encodeURIComponent(channelId)}/event-responses`

export function fetchEventResponses(channelId: string, signal?: AbortSignal): Promise<{ event_responses: EventResponse[] }> {
  return dashboardFetch(base(channelId), {}, { signal })
}

export function saveEventResponse(
  channelId: string,
  kind: string,
  values: EventValues,
  original: EventValues,
): Promise<{ event_response: EventResponse }> {
  return dashboardFetch(`${base(channelId)}/${encodeURIComponent(kind)}`, { method: "PUT", json: { values, original } })
}

/** 恢復預設：刪除自訂的設定 */
export function resetEventResponse(
  channelId: string,
  kind: string,
  original: EventValues,
): Promise<{ event_response: EventResponse }> {
  return dashboardFetch(`${base(channelId)}/${encodeURIComponent(kind)}`, { method: "DELETE", json: { original } })
}

/** 衝突提示用的字串形式，和後端 twitch_event_responses.comparable 一致（文字的欄位名是 response） */
export type ConflictValues = Record<string, string | null>

export function toConflictValues(values: EventValues): ConflictValues {
  return { enabled: values.enabled ? "true" : "false", response: values.template }
}

/** 409 回傳的最新值轉回表單的值，「以我的內容覆蓋」時當新的原始值 */
export function fromConflictValues(current: ConflictValues): EventValues {
  return { enabled: current.enabled === "true", template: current.response ?? "" }
}

/** 衝突提示裡欄位值的顯示文字 */
export function formatConflictField(field: string, value: string | null): string {
  if (field === "enabled") return value === "true" ? "開啟" : "關閉"
  return value === null || value === "" ? "無" : value
}

/** 後端 409 / 400 / 422 / 503 的回應拆成表單好處理的形狀；其他錯誤回 null。 */
export type SaveProblem =
  | { kind: "conflict"; current: ConflictValues | null }
  | { kind: "invalid_field"; field: string; reason: string }
  | { kind: "automod_blocked" }
  | { kind: "automod_unavailable" }
  | { kind: "not_enabled" }

export function parseSaveProblem(e: unknown): SaveProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  const body = (e.body ?? {}) as { current?: ConflictValues | null; field?: string; reason?: string }
  switch (e.code) {
    case "conflict":
      return { kind: "conflict", current: body.current ?? null }
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
