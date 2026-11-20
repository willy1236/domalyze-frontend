// 成員看的伺服器語音排行：資料型別與 API 呼叫。

import { dashboardFetch } from "./dashboard-api"
import type { LeaderboardMember } from "./dashboard-settings"

export const VOICE_RANKING_PATH = "/dashboard/voice-ranking"
export const VOICE_RANKING_PAGE_SIZE = 50

export interface VoiceRankingRow {
  rank: number
  member: LeaderboardMember
  minutes: number
}

export interface VoiceRankingPage {
  guild_name: string
  /** 伺服器內有紀錄的人數 */
  total: number
  /** 這一頁；mine 表示是自己可見的 Discord 之一 */
  items: (VoiceRankingRow & { mine: boolean })[]
  /** 自己可見的 Discord 在這個伺服器的名次，不受分頁影響 */
  mine: VoiceRankingRow[]
}

export function voiceRankingHref(guildId: string): string {
  return `${VOICE_RANKING_PATH}/${encodeURIComponent(guildId)}`
}

export function fetchVoiceRanking(guildId: string, offset: number, signal?: AbortSignal): Promise<VoiceRankingPage> {
  const query = `offset=${offset}&limit=${VOICE_RANKING_PAGE_SIZE}`
  return dashboardFetch(`/dashboard/personal/voice-ranking/${encodeURIComponent(guildId)}?${query}`, {}, { signal })
}

const ERRORS: Record<string, string> = {
  not_member: "你目前不在這個伺服器，無法查看排行。",
  bot_not_in_guild: "星羽已不在這個伺服器，無法查看排行。",
}

/** 載入失敗的說明 */
export function voiceRankingErrorText(code: string | null): string {
  return (code && ERRORS[code]) || "無法載入排行，請稍後重新整理頁面再試。"
}
