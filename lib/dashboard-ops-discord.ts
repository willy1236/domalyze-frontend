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
  live: {
    /** 主伺服器（共通成員的預設對照）；沒有設定時為 null */
    main_guild_id: string | null
    guild_count: number
    user_count: number
    guilds: OpsGuild[]
  } | null
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

export function guildEventLabel(event: GuildEvent): string {
  return event.event === "join" ? "加入" : "離開"
}

// ====== ID 查詢 ======

export const OPS_LOOKUP_PATH = `${OPS_DISCORD_PATH}/lookup`

export interface GuildRef {
  id: string
  name: string
  icon_url: string | null
}

export interface MutualGuild {
  guild: GuildRef
  /** 成員快取裡沒有該成員時為 null */
  member: {
    nick: string | null
    top_role: { id: string; name: string }
    joined_at: string | null
    timed_out: boolean
    /** 沒有 presence 資料時為 null（不明） */
    status: string | null
    activity: string | null
  } | null
}

export interface UserMatch {
  kind: "user"
  id: string
  name: string
  username: string
  avatar_url: string
  created_at: string
  bot: boolean
  system: boolean
  guilds: MutualGuild[]
}

export interface ChannelMatch {
  kind: "channel"
  id: string
  name: string | null
  type: string
  category: { id: string; name: string } | null
  guild: GuildRef | null
  created_at: string | null
}

export interface GuildMatch extends GuildRef {
  kind: "guild"
  owner: OpsGuild["owner"]
  member_count: number | null
  text_channels: number
  voice_channels: number
  verification_level: string
  created_at: string
}

export interface RoleMatch {
  kind: "role"
  id: string
  name: string
  guild: GuildRef
  position: number
  /** 沒有設定顏色時為 null */
  color: string | null
  /** 權限位元值（十進位字串，可能超過 Number 的精確範圍） */
  permissions: string
}

export interface DiscordEmbed {
  title?: string
  description?: string
  url?: string
  fields?: { name: string; value: string }[]
}

export interface MessageMatch {
  kind: "message"
  id: string
  channel: { id: string; name: string | null }
  guild: GuildRef | null
  author: { id: string; name: string; avatar_url: string }
  content: string
  /** 沒有 message content intent 而讀不到內容；false 且 content 為空才是真的空訊息 */
  content_hidden: boolean
  created_at: string
  jump_url: string
  embeds: DiscordEmbed[]
  attachments: { filename: string; url: string }[]
}

/** 該種類查詢失敗：unavailable 是 Discord 暫時查不到；channel_not_found、forbidden 只出現在訊息 */
export interface LookupFailure {
  kind: "user" | "message"
  error: "unavailable" | "channel_not_found" | "forbidden"
}

export type LookupMatch = UserMatch | ChannelMatch | GuildMatch | RoleMatch | MessageMatch | LookupFailure

export interface LookupResult {
  id: string
  /** 從 ID 換算的建立時間 */
  created_at: string
  member_cache_complete: boolean
  matches: LookupMatch[]
}

export function lookupPath(id: string, channelId?: string): string {
  const params = new URLSearchParams({ id })
  if (channelId) params.set("channel_id", channelId)
  return `${OPS_LOOKUP_PATH}?${params}`
}

export function fetchLookup(id: string, channelId: string | null, signal?: AbortSignal): Promise<LookupResult> {
  const params = new URLSearchParams({ id })
  if (channelId) params.set("channel_id", channelId)
  return dashboardFetch(`/dashboard/ops/discord/lookup?${params}`, {}, { signal })
}

const SNOWFLAKE_MAX = "18446744073709551615"

/** 1 到 2^64-1 的整數 ID（與後端的 invalid_id 判斷一致） */
export function isValidId(value: string): boolean {
  // 後端先擋超過 20 位的字串（含前導 0），這裡一致
  if (value.length > SNOWFLAKE_MAX.length || !/^\d+$/.test(value)) return false
  const digits = value.replace(/^0+/, "")
  if (digits === "") return false
  return digits.length < SNOWFLAKE_MAX.length || (digits.length === SNOWFLAKE_MAX.length && digits <= SNOWFLAKE_MAX)
}

export function isLookupFailure(match: LookupMatch): match is LookupFailure {
  return "error" in match
}

export function lookupFailureText(failure: LookupFailure): string {
  switch (failure.error) {
    case "channel_not_found":
      return "找不到這個頻道"
    case "forbidden":
      return "沒有權限讀取這則訊息"
    default:
      return "暫時查不到，請稍後再試"
  }
}

const STATUS_LABELS: Record<string, string> = {
  online: "線上",
  idle: "閒置",
  dnd: "請勿打擾",
  offline: "離線",
  invisible: "離線",
}

/** 成員目前狀態；沒有 presence 資料時顯示不明，不當成離線 */
export function memberStatusLabel(status: string | null): string {
  return status === null ? "不明" : (STATUS_LABELS[status] ?? status)
}

/** 訊息內容的顯示：讀不到內容與真的空訊息分開 */
export function messageContentText(message: Pick<MessageMatch, "content" | "content_hidden">): string | null {
  if (message.content_hidden) return "讀不到內容（未開啟 message content intent）"
  return message.content === "" ? null : message.content
}

// ====== 共通成員 ======

export const OPS_COMMON_PATH = `${OPS_DISCORD_PATH}/common`

export interface CommonMember {
  id: string
  name: string
  avatar_url: string
  joined_a: string | null
  joined_b: string | null
}

export interface CommonMembers {
  a: GuildRef
  b: GuildRef
  /** 依 a 邊的加入時間排序 */
  members: CommonMember[]
}

/** b 省略時後端用主伺服器 */
export function commonMembersPath(a: string, b?: string): string {
  const params = new URLSearchParams({ a })
  if (b) params.set("b", b)
  return `${OPS_COMMON_PATH}?${params}`
}

export function fetchCommonMembers(a: string, b: string, signal?: AbortSignal): Promise<CommonMembers> {
  return dashboardFetch(`/dashboard/ops/discord/common-members?${new URLSearchParams({ a, b })}`, {}, { signal })
}
