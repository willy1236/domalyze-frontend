import { channelPath } from "./dashboard-channel"

/** 頻道頁的區塊；順序即側欄顯示順序。各區塊頁面完成前先放「尚未開放」。 */
export type ChannelSectionKey = "overview" | "commands" | "timers" | "events" | "forward" | "settings"

export interface ChannelNavItem {
  key: ChannelSectionKey
  label: string
  /** 相對於 /dashboard/twitch/[id] 的路徑；總覽是頻道頁本身，所以是空字串 */
  path: string
}

export const CHANNEL_NAV: readonly ChannelNavItem[] = [
  { key: "overview", label: "總覽", path: "" },
  { key: "commands", label: "指令", path: "/commands" },
  { key: "timers", label: "計時訊息", path: "/timers" },
  { key: "events", label: "事件回應", path: "/events" },
  { key: "forward", label: "轉發 Discord", path: "/forward" },
  { key: "settings", label: "設定", path: "/settings" },
]

export function channelSectionHref(channelId: string, item: ChannelNavItem): string {
  return `${channelPath(channelId)}${item.path}`
}

/** 總覽只在網址完全相符時算所在位置，其他區塊含子路徑 */
export function isChannelSectionActive(channelId: string, item: ChannelNavItem, pathname: string): boolean {
  const href = channelSectionHref(channelId, item)
  return item.path === "" ? pathname === href : pathname.startsWith(href)
}
