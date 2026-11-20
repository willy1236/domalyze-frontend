// 頻道後台的 Discord 轉發：資料型別、API，以及表單用的轉換。對應後端 channel_forward.py。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import type { ChannelOption } from "./dashboard-options"

export interface ForwardGuild {
  id: string
  /** bot 暫時查不到（沒 ready 或已離開）時為 null */
  name: string | null
}

export interface ForwardChannel {
  id: string
  name: string | null
}

export interface ForwardSetting {
  /** 只有析域登入且有 Discord 才能修改 */
  editable: boolean
  guild: ForwardGuild | null
  channel: ForwardChannel | null
}

export interface ForwardGuildOption {
  id: string
  name: string
  icon_url: string | null
  channels: ChannelOption[]
}

/** 表單的值：選到的伺服器與頻道，null 表示沒選 */
export interface ForwardValues {
  guildId: string | null
  channelId: string | null
}

const base = (channelId: string) => `/dashboard/channels/${encodeURIComponent(channelId)}/forward`

export function fetchForward(channelId: string, signal?: AbortSignal): Promise<ForwardSetting> {
  return dashboardFetch(base(channelId), {}, { signal })
}

export function fetchForwardOptions(channelId: string, signal?: AbortSignal): Promise<{ guilds: ForwardGuildOption[] }> {
  return dashboardFetch(`${base(channelId)}/options`, {}, { signal })
}

/** 儲存；values.channelId 為 null 時清除設定 */
export function saveForward(channelId: string, values: ForwardValues): Promise<ForwardSetting> {
  const json =
    values.channelId === null
      ? { guild_id: null, channel_id: null }
      : { guild_id: Number(values.guildId), channel_id: Number(values.channelId) }
  return dashboardFetch(base(channelId), { method: "PUT", json })
}

/** 目前儲存的設定轉成表單的值 */
export function valuesOf(setting: ForwardSetting): ForwardValues {
  return { guildId: setting.guild?.id ?? null, channelId: setting.channel?.id ?? null }
}

export function isDirty(base: ForwardValues, draft: ForwardValues): boolean {
  return base.guildId !== draft.guildId || base.channelId !== draft.channelId
}

/** 指定伺服器可選的頻道；還沒選伺服器或找不到時為空 */
export function channelsOf(guilds: readonly ForwardGuildOption[], guildId: string | null): ChannelOption[] {
  return guilds.find((g) => g.id === guildId)?.channels ?? []
}

/** 目前設定的文字：「伺服器 / #頻道」，查不到名稱時顯示 id */
export function describeSetting(setting: Pick<ForwardSetting, "guild" | "channel">): string | null {
  if (setting.channel === null) return null
  const channel = `# ${setting.channel.name ?? setting.channel.id}`
  if (setting.guild === null) return channel
  return `${setting.guild.name ?? setting.guild.id} / ${channel}`
}

/** 儲存失敗時表單要顯示的情形；其他錯誤回 null */
export type ForwardProblem =
  | { kind: "forbidden" }
  | { kind: "not_allowed" }
  | { kind: "invalid_channel" }
  | { kind: "bot_missing" }
  | { kind: "unavailable" }

export function parseForwardProblem(e: unknown): ForwardProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  switch (e.code) {
    case "forward_forbidden":
      return { kind: "forbidden" }
    case "forward_not_allowed":
      return { kind: "not_allowed" }
    case "invalid_channel":
      return { kind: "invalid_channel" }
    case "bot_not_in_guild":
      return { kind: "bot_missing" }
    case "bot_unavailable":
    case "guild_unavailable":
      return { kind: "unavailable" }
    default:
      return null
  }
}

export function forwardProblemMessage(problem: ForwardProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return "你在這個伺服器沒有「管理頻道」權限。"
    case "not_allowed":
      return "需要用有 Discord 的析域帳號登入才能修改。"
    case "invalid_channel":
      return "星羽無法在這個頻道發言，請換一個頻道。"
    case "bot_missing":
      return "星羽不在這個伺服器，請先邀請星羽加入。"
    case "unavailable":
      return "星羽目前無法連到 Discord，請稍後再試。"
  }
}
