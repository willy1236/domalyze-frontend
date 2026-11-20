// 實況主頻道後台的資料與共用判斷。

import { API_BASE, DashboardApiError, dashboardFetch } from "./dashboard-api"
import type { AuditEntriesPage } from "./dashboard-audit"
import type { ChannelHealth } from "./dashboard-channel-health"

export type ChannelState = "inactive" | "enabled" | "disabled" | "banned"

/** 星羽支援 Discord 伺服器的邀請連結；停權頁讓實況主來詢問 */
export const SUPPORT_DISCORD_URL = "https://discord.gg/P4jqdcMxkH"

/** 登入者在這個頻道的角色：實況主本人，或頻道的 mod（只能改指令、計時訊息、事件回應，其餘只看狀態） */
export type ChannelRole = "owner" | "mod"

export interface ChannelInfo {
  id: string
  login: string
  name: string
  avatar_url: string | null
  role: ChannelRole
  state: ChannelState
}

/** 轉發 Discord 的可用情形：ok、不是析域登入、析域登入但沒有 Discord；mod 一律是 mod（只看目前設定） */
export type ForwardAccess = "ok" | "need_domalyze" | "need_discord" | "mod"

export interface ChannelDetail extends ChannelInfo {
  forward_access: ForwardAccess
  /** 實況主是否開放 mod 協作（mod 進入頻道後台、在聊天室管理指令） */
  mod_collab_enabled: boolean
  /** 權限問題與暫停的功能（即時判定，不存 DB） */
  health: ChannelHealth
}

/** 頻道清單頁；頻道後台的前端網址都從這裡與 channelPath 組出，後端 API 仍在 /dashboard/channels */
export const CHANNEL_LIST_PATH = "/dashboard/twitch"

export function channelPath(channelId: string): string {
  return `${CHANNEL_LIST_PATH}/${encodeURIComponent(channelId)}`
}

export function fetchChannels(signal?: AbortSignal): Promise<{ channels: ChannelInfo[] }> {
  return dashboardFetch("/dashboard/channels", {}, { signal })
}

export function fetchChannel(channelId: string, signal?: AbortSignal): Promise<ChannelDetail> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}`, {}, { signal })
}

/** 頻道保留的整份修改紀錄（新的在前，每頁 50 筆）；實況主與 mod 都看得到 */
export function fetchChannelAudit(channelId: string, page: number, signal?: AbortSignal): Promise<AuditEntriesPage> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/audit?page=${page}`, {}, { signal })
}

/** 沒有這個頻道的權限；不在全域處理，由頻道頁自己顯示 */
export function isChannelForbidden(error: unknown): boolean {
  return error instanceof DashboardApiError && error.code === "channel_forbidden"
}

/** 星羽狀態的簡短說明，依 DB 的 state 分未啟用、已啟用、已停用；部分暫停見 healthStatusLabel */
export function channelStatusLabel(state: ChannelState): string {
  switch (state) {
    case "enabled":
      return "星羽已啟用"
    case "disabled":
      return "星羽已停用"
    case "inactive":
      return "星羽未啟用"
    case "banned":
      return "星羽已停權"
  }
}

export type ChannelAction = { kind: "enable"; label: string } | { kind: "disable"; label: string } | { kind: "none" }

/** 目前 state 該提供的操作：未啟用與已停用都是（重新）啟用，已啟用只能停用，已停權沒有操作 */
export function channelAction(state: ChannelState): ChannelAction {
  switch (state) {
    case "enabled":
      return { kind: "disable", label: "停用星羽" }
    case "disabled":
      return { kind: "enable", label: "重新啟用" }
    case "inactive":
      return { kind: "enable", label: "啟用星羽" }
    case "banned":
      return { kind: "none" }
  }
}

/** 後端的啟用入口：整頁導向 Twitch 授權，完成後回到頻道頁 */
export function enableUrl(channelId: string, origin: string): string {
  const params = new URLSearchParams({ channel: channelId, origin })
  return `${API_BASE}/to/dashboard-twitch-enable?${params.toString()}`
}

export interface DisableResult {
  state: ChannelState
  /** 星羽沒有完成同步（離線或內部出錯）；state 已經改好，上線後依資料庫為準 */
  bot_offline: boolean
}

export function disableChannel(channelId: string): Promise<DisableResult> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/disable`, { method: "POST" })
}

/** 啟用流程導回頻道頁時，網址 `?notice=` 帶的代碼（多個以逗號分隔） */
export type ChannelNotice =
  | "wrong_account"
  | "bot_offline"
  | "mod_failed"
  | "enable_failed"
  | "channel_banned"
  | "disable_bot_offline"
  | "owner_only"

export const CHANNEL_NOTICES: Record<ChannelNotice, string> = {
  wrong_account: "請用頻道本人的帳號授權。",
  bot_offline: "星羽暫時離線，上線後自動生效。",
  mod_failed: "星羽沒有自動成為頻道 mod。請在聊天室輸入 /mod xingyu1016；若星羽目前是你的 VIP，請先移除 VIP。",
  enable_failed: "啟用沒有完成，請再試一次。",
  channel_banned: "這個頻道已被停權，不能啟用星羽。",
  disable_bot_offline: "已停用，但星羽暫時離線，上線後會離開聊天室。",
  owner_only: "只有實況主本人能啟用或修復星羽。",
}

/** 停用成功後要顯示的提示：星羽沒有完成同步時，state 已經是已停用，但還在聊天室，要等它上線才會離開 */
export function disableNotices(result: DisableResult): ChannelNotice[] {
  return result.bot_offline ? ["disable_bot_offline"] : []
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
    case "mod":
      return null
  }
}

/** 頻道清單與個人區的角色標示 */
export function channelRoleLabel(role: ChannelRole): string {
  return role === "owner" ? "我的頻道" : "mod"
}

export type ChannelListView = { kind: "empty" } | { kind: "list" }

/** 頻道清單頁怎麼呈現：沒有頻道顯示空狀態，其餘（含只有一個）一律列出，不自動導入 */
export function channelListView(channels: readonly ChannelInfo[]): ChannelListView {
  return channels.length === 0 ? { kind: "empty" } : { kind: "list" }
}

/** 連結 Twitch 帳號的說明：析域登入連結後會出現在清單；其他登入方式要改用析域帳號登入才看得到 */
export function linkTwitchNote(loginMethod: "discord" | "domalyze" | "twitch" | undefined): string {
  return loginMethod === "domalyze"
    ? "連結後 60 秒內會出現在這裡。"
    : "連結到析域帳號後，用析域帳號登入就能在這裡管理所有頻道。"
}

/** 頻道清單頁網址 `?notice=` 帶的代碼 */
export type ChannelListNotice = "channel_unlinked" | "mod_removed"

export const CHANNEL_LIST_NOTICES: Record<ChannelListNotice, string> = {
  channel_unlinked: "剛才的頻道已不在這個析域帳號的連結裡，已回到頻道清單。",
  mod_removed: "你已不能管理剛才的頻道：可能已不是這個頻道的 mod，或實況主關閉了 mod 協作。已回到頻道清單。",
}

export const CHANNEL_UNLINKED_URL = `${CHANNEL_LIST_PATH}?notice=channel_unlinked`
export const CHANNEL_MOD_REMOVED_URL = `${CHANNEL_LIST_PATH}?notice=mod_removed`

/** 解析頻道清單頁的 notice 參數；不認得的代碼回 null */
export function parseChannelListNotice(value: string | null): ChannelListNotice | null {
  return value !== null && Object.hasOwn(CHANNEL_LIST_NOTICES, value) ? (value as ChannelListNotice) : null
}

/**
 * 頻道頁收到錯誤後該不該離開（沒有權限時）：已載入的頻道原本是 mod 頻道，回到頻道清單並提示不能再管理；
 * 用析域登入、頻道被解除連結，回到頻道清單並提示。其他情況或其他錯誤留在原頁，由頁面顯示錯誤。
 * `role` 是這一頁已載入的頻道角色，還沒載入過時為 undefined。
 */
export function channelLeaveTarget(
  error: unknown,
  loginMethod: string | undefined,
  role?: ChannelRole,
): string | null {
  if (!isChannelForbidden(error)) return null
  if (role === "mod") return CHANNEL_MOD_REMOVED_URL
  return loginMethod === "domalyze" ? CHANNEL_UNLINKED_URL : null
}

/**
 * 頻道頁的寫入操作收到錯誤時先呼叫：沒有權限（channel_forbidden）而且該離開時（見 channelLeaveTarget），
 * 用 replace 回到頻道清單並提示，回傳 true，呼叫端不必再處理這個錯誤；其他情況回傳 false。
 */
export function leaveIfUnlinked(
  error: unknown,
  loginMethod: string | undefined,
  replace: (url: string) => void,
  role?: ChannelRole,
): boolean {
  const target = channelLeaveTarget(error, loginMethod, role)
  if (target === null) return false
  replace(target)
  return true
}
