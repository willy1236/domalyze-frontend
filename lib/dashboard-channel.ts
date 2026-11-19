// 實況主頻道後台的資料與共用判斷。

import { API_BASE, DashboardApiError, dashboardFetch } from "./dashboard-api"

export type ChannelState = "inactive" | "enabled" | "disabled"

export interface ChannelInfo {
  id: string
  login: string
  name: string
  avatar_url: string | null
  state: ChannelState
}

/** 轉發 Discord 的可用情形：ok、不是析域登入、析域登入但沒有 Discord */
export type ForwardAccess = "ok" | "need_domalyze" | "need_discord"

export interface ChannelDetail extends ChannelInfo {
  forward_access: ForwardAccess
}

export function channelPath(channelId: string): string {
  return `/dashboard/channels/${encodeURIComponent(channelId)}`
}

export function fetchChannels(signal?: AbortSignal): Promise<{ channels: ChannelInfo[] }> {
  return dashboardFetch("/dashboard/channels", {}, { signal })
}

export function fetchChannel(channelId: string, signal?: AbortSignal): Promise<ChannelDetail> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}`, {}, { signal })
}

/** 沒有這個頻道的權限；不在全域處理，由頻道頁自己顯示 */
export function isChannelForbidden(error: unknown): boolean {
  return error instanceof DashboardApiError && error.code === "channel_forbidden"
}

/** bot 狀態的簡短說明；完整判定由 W-08 擴充，這裡只依 state 分未啟用、已啟用、已停用 */
export function channelStatusLabel(state: ChannelState): string {
  switch (state) {
    case "enabled":
      return "bot 已啟用"
    case "disabled":
      return "bot 已停用"
    case "inactive":
      return "bot 未啟用"
  }
}

export type ChannelAction = { kind: "enable"; label: string } | { kind: "disable"; label: string }

/** 目前 state 該提供的操作：未啟用與已停用都是（重新）啟用，已啟用只能停用 */
export function channelAction(state: ChannelState): ChannelAction {
  switch (state) {
    case "enabled":
      return { kind: "disable", label: "停用 bot" }
    case "disabled":
      return { kind: "enable", label: "重新啟用" }
    case "inactive":
      return { kind: "enable", label: "啟用 bot" }
  }
}

/** 後端的啟用入口：整頁導向 Twitch 授權，完成後回到頻道頁 */
export function enableUrl(channelId: string, origin: string): string {
  const params = new URLSearchParams({ channel: channelId, origin })
  return `${API_BASE}/to/dashboard-twitch-enable?${params.toString()}`
}

export interface DisableResult {
  state: ChannelState
  /** bot 沒有完成同步（離線或內部出錯）；state 已經改好，bot 上線後依資料庫為準 */
  bot_offline: boolean
}

export function disableChannel(channelId: string): Promise<DisableResult> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/disable`, { method: "POST" })
}

/** 啟用流程導回頻道頁時，網址 `?notice=` 帶的代碼（多個以逗號分隔） */
export type ChannelNotice = "wrong_account" | "bot_offline" | "mod_failed" | "enable_failed"

export const CHANNEL_NOTICES: Record<ChannelNotice, string> = {
  wrong_account: "請用頻道本人的帳號授權。",
  bot_offline: "bot 暫時離線，上線後自動生效。",
  mod_failed: "bot 沒有自動成為頻道 mod。請在聊天室輸入 /mod xingyu1016；若 bot 目前是你的 VIP，請先移除 VIP。",
  enable_failed: "啟用沒有完成，請再試一次。",
}

/** 解析網址的 notice 參數；不認得的代碼忽略 */
export function parseChannelNotices(value: string | null): ChannelNotice[] {
  if (value === null) return []
  return value.split(",").filter((code): code is ChannelNotice => Object.hasOwn(CHANNEL_NOTICES, code))
}

export function forwardAccessNotice(access: ForwardAccess): { title: string; body: string } | null {
  switch (access) {
    case "need_domalyze":
      return {
        title: "需要析域帳號",
        body: "把事件轉發到 Discord 需要用析域帳號登入。請先到析域帳號頁連結這個 Twitch 與 Discord，再改用析域帳號登入。",
      }
    case "need_discord":
      return {
        title: "需要連結 Discord",
        body: "這個析域帳號還沒有連結 Discord。請先到析域帳號頁連結 Discord，再重新登入。",
      }
    case "ok":
      return null
  }
}

export type ChannelListView = { kind: "empty" } | { kind: "redirect"; channelId: string } | { kind: "list" }

/** 頻道清單頁怎麼呈現：沒有頻道、只有一個時直接進去，多個才列出 */
export function channelListView(channels: readonly ChannelInfo[]): ChannelListView {
  if (channels.length === 0) return { kind: "empty" }
  if (channels.length === 1) return { kind: "redirect", channelId: channels[0].id }
  return { kind: "list" }
}
