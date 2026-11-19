// 個人區的資料型別與顯示用的整理。

import { dashboardFetch } from "./dashboard-api"
import type { ChannelInfo } from "./dashboard-channel"

export interface PersonalPoints {
  stardust: number
  point: number
  rcoin: number
}

export interface PersonalPet {
  name: string
  species: string
  food: number | null
}

export interface PersonalDiscord {
  id: string
  name: string
  avatar_url: string
  /** 是否為目前 session 的 Discord */
  current: boolean
  points: PersonalPoints
  pet: PersonalPet | null
}

export interface PersonalOverview {
  /** 沒有析域帳號時為 null；username 為 null 表示代號暫時無法載入 */
  account: { username: string | null } | null
  /** auth server 暫時查不到連結了哪些 Discord，只有目前這個 Discord 的資料 */
  partial: boolean
  /** 沒有 Discord 身分的析域登入為空 */
  discords: PersonalDiscord[]
  /** 這個登入可以管理的 Twitch 頻道；沒有時為空 */
  channels: ChannelInfo[]
}

/** 欄位名稱同 /user */
export const POINT_LABELS: [keyof PersonalPoints, string][] = [
  ["stardust", "⭐星塵"],
  ["point", "PT點數"],
  ["rcoin", "Rcoin"],
]

/** 這個登入有 Discord 身分；沒有時（只連結 Twitch 的析域帳號）Discord 相關區塊都不顯示 */
export function hasDiscord(overview: PersonalOverview): boolean {
  return overview.discords.length > 0
}

/** 需要析域帳號的區塊（工具與公開設定）是否鎖住 */
export function isLocked(overview: PersonalOverview): boolean {
  return overview.account === null
}

/** 帳號區塊顯示的域民代號 */
export function accountLabel(account: { username: string | null }): string {
  return account.username ?? "代號暫時無法載入"
}

/** 舊網址 /dashboard?notice= 是伺服器清單的通知：回傳要轉去的伺服器清單網址（保留參數）；不需要轉址時回 null */
export function guildListRedirect(search: string): string | null {
  const params = new URLSearchParams(search)
  return params.has("notice") ? `/dashboard/guilds?${params.toString()}` : null
}

/** 回報「連結析域帳號」入口被按下（統計用）：不等回應，失敗也不影響開新分頁 */
export function reportLinkClick(): void {
  dashboardFetch("/dashboard/personal/link-click", { method: "POST" }, { sessionExpiredIsOk: true }).catch(() => {})
}
