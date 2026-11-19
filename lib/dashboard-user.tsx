"use client"

import { createContext, useContext } from "react"

/** /dashboard/me 的回應：session 的登入身分 */
export interface DashboardUser {
  /** 主身分 key：有 Discord 時是 Discord ID，Twitch 登入是 `twitch:<id>` */
  id: string
  name: string
  avatar_url: string
  /** Discord 身分；只用 Twitch 登入時為 null */
  discord: { id: string } | null
  /** Twitch 身分；沒有時為 null */
  twitch: { id: string; login: string } | null
  /** 這個 session 帶的析域帳號；username 為 null 表示代號暫時無法載入 */
  account: { username: string | null } | null
  login_method: "discord" | "domalyze" | "twitch"
}

export interface DashboardNavItem {
  href: string
  label: string
  active: (path: string) => boolean
}

const NAV: (DashboardNavItem & { needsDiscord: boolean })[] = [
  { href: "/dashboard", label: "我的", active: (path) => path === "/dashboard", needsDiscord: false },
  {
    href: "/dashboard/guilds",
    label: "伺服器",
    active: (path) => path.startsWith("/dashboard/guilds"),
    needsDiscord: true,
  },
]

/** 後台頂端導覽；伺服器相關的項目只在有 Discord 身分時顯示 */
export function dashboardNav(user: DashboardUser): DashboardNavItem[] {
  return NAV.filter((item) => !item.needsDiscord || user.discord !== null)
}

export const DashboardUserContext = createContext<DashboardUser | null>(null)

/** 目前登入的身分；在 DashboardUserContext 之外為 null */
export function useDashboardUser(): DashboardUser | null {
  return useContext(DashboardUserContext)
}
