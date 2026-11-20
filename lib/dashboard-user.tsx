"use client"

import { createContext, useContext } from "react"
import { CHANNEL_LIST_PATH } from "./dashboard-channel"
import { OPS_PATH } from "./dashboard-ops"
import { VOICE_RANKING_PATH } from "./dashboard-voice-ranking"

/** /dashboard/me 的回應：session 的登入身分 */
export interface DashboardUser {
  /** 主身分 key：有 Discord 時是 Discord ID，Twitch 登入是 `twitch:<id>` */
  id: string
  name: string
  /** 沒有頭像時為 null（沒有 Discord 的析域登入） */
  avatar_url: string | null
  /** Discord 身分；只用 Twitch 登入時為 null */
  discord: { id: string } | null
  /** Twitch 身分；沒有時為 null */
  twitch: { id: string; login: string } | null
  /** 這個 session 帶的析域帳號；username 為 null 表示代號暫時無法載入 */
  account: { username: string | null } | null
  login_method: "discord" | "domalyze" | "twitch"
  /** 這個 session 有可以管理的 Twitch 頻道 */
  has_channels: boolean
  /** 是 bot owner：頁首才有「營運」 */
  is_bot_owner: boolean
}

export interface DashboardNavItem {
  href: string
  label: string
  active: (path: string) => boolean
}

const NAV: (DashboardNavItem & { visible: (user: DashboardUser) => boolean })[] = [
  {
    href: "/dashboard",
    label: "我的",
    active: (path) => path === "/dashboard" || path.startsWith(VOICE_RANKING_PATH),
    visible: () => true,
  },
  {
    href: "/dashboard/guilds",
    label: "Discord 伺服器",
    active: (path) => path.startsWith("/dashboard/guilds"),
    visible: (user) => user.discord !== null,
  },
  {
    href: CHANNEL_LIST_PATH,
    label: "Twitch 頻道",
    active: (path) => path.startsWith(CHANNEL_LIST_PATH),
    visible: (user) => user.has_channels,
  },
  {
    href: OPS_PATH,
    label: "營運",
    active: (path) => path.startsWith(OPS_PATH),
    visible: (user) => user.is_bot_owner,
  },
]

/** 後台頂端導覽；伺服器項目只在有 Discord 身分時顯示，頻道項目只在有可管理的頻道時顯示，營運項目只給 bot owner */
export function dashboardNav(user: DashboardUser): DashboardNavItem[] {
  return NAV.filter((item) => item.visible(user))
}

export const DashboardUserContext = createContext<DashboardUser | null>(null)

/** 目前登入的身分；在 DashboardUserContext 之外為 null */
export function useDashboardUser(): DashboardUser | null {
  return useContext(DashboardUserContext)
}
