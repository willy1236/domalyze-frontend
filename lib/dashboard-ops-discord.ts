// bot owner 營運入口的 Discord 部分：目前所在的伺服器、每日人數、加入離開紀錄。

import { dashboardFetch } from "./dashboard-api"

export const OPS_DISCORD_PATH = "/dashboard/ops/discord"

export interface OpsGuild {
  id: string
  name: string
  icon_url: string | null
  member_count: number | null
  joined_at: string | null
  /** 群主；成員快取沒有群主時 name、avatar_url 為 null */
  owner: { id: string; name: string | null; avatar_url: string | null } | null
}

export interface DailyCount {
  /** YYYY-MM-DD */
  date: string
  users: number
  servers: number
}

export interface OpsDiscordOverview {
  /** 星羽沒有就緒時為 null */
  live: { guild_count: number; user_count: number; guilds: OpsGuild[] } | null
  daily: DailyCount[]
}

export interface GuildEvent {
  id: number
  guild_id: string
  guild_name: string | null
  event: "join" | "leave"
  member_count: number | null
  at: string
  /** gateway：即時收到；startup：啟動時補記 */
  source: "gateway" | "startup"
}

export interface GuildEventPage {
  events: GuildEvent[]
  page: number
  has_next: boolean
}

export const RANGES = [
  { days: 30, label: "30 天" },
  { days: 90, label: "90 天" },
  { days: 365, label: "1 年" },
  { days: 3650, label: "全部" },
] as const

export function fetchOpsDiscord(days: number, signal?: AbortSignal): Promise<OpsDiscordOverview> {
  return dashboardFetch(`/dashboard/ops/discord?days=${days}`, {}, { signal })
}

export function fetchGuildEvents(page: number, signal?: AbortSignal): Promise<GuildEventPage> {
  return dashboardFetch(`/dashboard/ops/discord/events?page=${page}`, {}, { signal })
}

/** Discord 使用者個人資料頁 */
export function discordUserUrl(userId: string): string {
  return `https://discord.com/users/${encodeURIComponent(userId)}`
}

/** 加入離開紀錄一列的事件文字；啟動時補記的離開只知道發生在離線期間 */
export function guildEventLabel(event: GuildEvent): string {
  if (event.event === "join") return event.source === "startup" ? "加入（啟動時補記）" : "加入"
  return event.source === "startup" ? "離開（離線期間，啟動時發現）" : "離開"
}
