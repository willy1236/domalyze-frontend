// 實況主頻道後台的資料與共用判斷。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

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

/** bot 狀態的簡短說明；完整判定由 W-08 擴充，這裡只分啟用與未啟用 */
export function channelStatusLabel(state: ChannelState): string {
  return state === "enabled" ? "bot 已啟用" : "bot 未啟用"
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
