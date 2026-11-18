// 個人區紀錄的資料型別、API 呼叫與顯示用的整理。

import { dashboardFetch } from "./dashboard-api"

export const PAGE_SIZE = 20

/** bot 已離開、取不到名稱的伺服器 */
export const UNKNOWN_GUILD = "無法取得名稱的伺服器"

export interface VoiceRecord {
  guild_name: string | null
  minutes: number
}

export interface WarningRecord {
  id: number
  guild_name: string | null
  type: "warning" | "timeout" | "kick" | "ban"
  at: string
  reason: string | null
  duration_seconds: number | null
}

export interface PollRecord {
  id: number
  guild_name: string | null
  /** 投票已被刪除時為 null */
  title: string | null
  options: string[]
  at: string
}

export interface BetRecord {
  id: number
  title: string | null
  option: string | null
  amount: number
  /** 舊版指令下注沒有記錄時間 */
  at: string | null
}

export interface GiveawayRecord {
  id: number
  guild_name: string | null
  prize: string | null
  result: "won" | "lost" | "pending" | "deleted"
  at: string
}

export interface RecordKinds {
  warnings: WarningRecord
  polls: PollRecord
  bets: BetRecord
  giveaways: GiveawayRecord
}

export type RecordKind = keyof RecordKinds

export interface RecordPage<T> {
  items: T[]
  total: number
}

export const KIND_LABELS: Record<RecordKind, string> = {
  warnings: "警告與懲處",
  polls: "投票",
  bets: "賭盤",
  giveaways: "抽獎",
}

export const WARNING_TYPE_LABELS: Record<WarningRecord["type"], string> = {
  warning: "警告",
  timeout: "禁言",
  kick: "踢出",
  ban: "停權",
}

export const GIVEAWAY_RESULT_LABELS: Record<GiveawayRecord["result"], string> = {
  won: "中獎",
  lost: "未中獎",
  pending: "尚未開獎",
  deleted: "抽獎已刪除",
}

export function fetchVoice(discordId: string, signal?: AbortSignal): Promise<{ items: VoiceRecord[] }> {
  return dashboardFetch(`/dashboard/personal/records/voice?discord_id=${encodeURIComponent(discordId)}`, {}, { signal })
}

export function fetchRecords<K extends RecordKind>(
  kind: K,
  discordId: string,
  offset: number,
  signal?: AbortSignal,
): Promise<RecordPage<RecordKinds[K]>> {
  const query = `discord_id=${encodeURIComponent(discordId)}&offset=${offset}&limit=${PAGE_SIZE}`
  return dashboardFetch(`/dashboard/personal/records/${kind}?${query}`, {}, { signal })
}

/** 「X 小時 Y 分」 */
export function formatVoiceMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)} 小時 ${minutes % 60} 分`
}

/** 禁言時長：「1 天 2 小時 3 分」，不足一分鐘顯示「不到 1 分」 */
export function formatSpan(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return "不到 1 分"
  const parts: string[] = []
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60
  if (days) parts.push(`${days} 天`)
  if (hours) parts.push(`${hours} 小時`)
  if (rest) parts.push(`${rest} 分`)
  return parts.join(" ")
}

export function formatRecordTime(iso: string | null): string {
  if (iso === null) return "時間不明"
  return new Date(iso).toLocaleString("zh-TW", { hour12: false, dateStyle: "medium", timeStyle: "short" })
}

export function guildLabel(name: string | null): string {
  return name ?? UNKNOWN_GUILD
}
