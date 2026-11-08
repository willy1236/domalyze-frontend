// 頻道通知的種類表與寫入 API。種類表對應後端 notify_fields.py 的 CHANNEL_SPECS，欄位以打勾為準。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export interface ChannelNotifyType {
  /** 字串種類鍵，例如 channel:4 */
  key: string
  name: string
  hasRole: boolean
  hasMessage: boolean
  /** 定時通知：持續編輯同一則訊息 */
  scheduled: boolean
}

const t = (key: number, name: string, o: Partial<Omit<ChannelNotifyType, "key" | "name">> = {}): ChannelNotifyType => ({
  key: `channel:${key}`,
  name,
  hasRole: false,
  hasMessage: false,
  scheduled: false,
  ...o,
})

export const CHANNEL_NOTIFY_TYPES: ChannelNotifyType[] = [
  t(1, "全群公告", { hasRole: true }),
  t(2, "機器人更新通知", { hasRole: true }),
  t(3, "顯著有感地震通知", { hasRole: true }),
  t(12, "小規模地震通知", { hasRole: true }),
  t(11, "天氣特警報", { hasRole: true }),
  t(4, "台灣各縣市天氣預報", { scheduled: true }),
  t(5, "Apex地圖輪替", { scheduled: true }),
  t(7, "成員加入", { hasMessage: true }),
  t(8, "成員離開", { hasMessage: true }),
  t(6, "成員加入日誌"),
  t(13, "成員離開日誌"),
  t(10, "語音進出紀錄"),
]

export type ChannelNotifyValues = Record<string, string | null>

/** 該種類用得到的欄位名稱，順序固定 */
export function fieldNames(type: ChannelNotifyType): string[] {
  return ["channel_id", ...(type.hasRole ? ["role_id"] : []), ...(type.hasMessage ? ["message"] : [])]
}

const path = (guildId: string, key: string) =>
  `/dashboard/guilds/${encodeURIComponent(guildId)}/channel-notifies/${encodeURIComponent(key)}`

/** 新增（original 為 null）或修改。 */
export function saveChannelNotify(
  guildId: string,
  key: string,
  values: ChannelNotifyValues,
  original: ChannelNotifyValues | null,
): Promise<void> {
  return dashboardFetch(path(guildId, key), { method: "PUT", json: { values, original } })
}

export function deleteChannelNotify(guildId: string, key: string, original: ChannelNotifyValues): Promise<void> {
  return dashboardFetch(path(guildId, key), { method: "DELETE", json: { original } })
}

/** 後端 409 / 400 的回應拆成表單好處理的形狀；其他錯誤回 null。 */
export type SaveProblem =
  | { kind: "conflict"; deleted: boolean; current: ChannelNotifyValues | null }
  | { kind: "already_exists"; current: ChannelNotifyValues }
  | { kind: "invalid_field"; field: string; reason: string }

export function parseSaveProblem(e: unknown): SaveProblem | null {
  if (!(e instanceof DashboardApiError) || !e.body) return null
  const body = e.body as { deleted?: boolean; current?: ChannelNotifyValues | null; field?: string; reason?: string }
  if (e.code === "conflict") return { kind: "conflict", deleted: body.deleted === true, current: body.current ?? null }
  if (e.code === "already_exists" && body.current) return { kind: "already_exists", current: body.current }
  if (e.code === "invalid_field" && body.field && body.reason) {
    return { kind: "invalid_field", field: body.field, reason: body.reason }
  }
  return null
}
