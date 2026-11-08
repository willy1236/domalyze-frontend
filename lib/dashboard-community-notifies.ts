// 社群推播的種類表與寫入 API。種類表對應後端 notify_fields.py 的 COMMUNITY_SPECS。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import type { ChannelNotifyValues } from "./dashboard-channel-notifies"

export type CommunityPlatform = "twitch" | "youtube" | "twitter"

export interface CommunityNotifyType {
  /** 字串種類鍵，例如 community:1 */
  key: string
  name: string
  platform: CommunityPlatform
  hasMessage: boolean
}

export const COMMUNITY_NOTIFY_TYPES: CommunityNotifyType[] = [
  { key: "community:1", name: "Twitch 開台通知", platform: "twitch", hasMessage: true },
  { key: "community:3", name: "Twitch 影片通知", platform: "twitch", hasMessage: true },
  { key: "community:4", name: "Twitch 剪輯通知", platform: "twitch", hasMessage: true },
  { key: "community:2", name: "YouTube", platform: "youtube", hasMessage: true },
  { key: "community:5", name: "Twitter", platform: "twitter", hasMessage: false },
]

export const PLATFORM_LABELS: Record<CommunityPlatform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  twitter: "Twitter",
}

export const PLATFORM_HINTS: Record<CommunityPlatform, string> = {
  twitch: "輸入使用者名稱，或貼上 twitch.tv 的網址",
  youtube: "輸入 @handle，或貼上 youtube.com 的頻道網址",
  twitter: "輸入使用者名稱，或貼上 x.com／twitter.com 的網址",
}

export const typesOf = (platform: CommunityPlatform) => COMMUNITY_NOTIFY_TYPES.filter((t) => t.platform === platform)

/** 一覽的 item key（含帳號 ID）對應的種類；推播的種類鍵只決定平台 */
export function platformOf(key: string): CommunityPlatform | null {
  return COMMUNITY_NOTIFY_TYPES.find((t) => t.key === key)?.platform ?? null
}

export interface ResolvedAccount {
  platform: CommunityPlatform
  account_id: string
  display_name: string | null
  username: string
}

export type ResolveFailure = "not_found" | "unsupported_format" | "platform_unavailable"

export const RESOLVE_FAILURE_TEXT: Record<ResolveFailure, string> = {
  not_found: "找不到這個帳號。",
  unsupported_format: "不支援這個名稱或網址的格式。",
  platform_unavailable: "平台暫時無法查詢，請稍後再試。",
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/community-notifies`
const itemPath = (guildId: string, key: string, accountId: string) =>
  `${base(guildId)}/${encodeURIComponent(key)}/${encodeURIComponent(accountId)}`

/** 最壞約 70 秒的 YouTube 訂閱等待，加上餘裕 */
const WRITE_TIMEOUT_MS = 90_000
/** rettiwt 查詢 timeout 是 30 秒 */
const RESOLVE_TIMEOUT_MS = 45_000

export function resolveAccount(guildId: string, platform: CommunityPlatform, input: string): Promise<ResolvedAccount> {
  return dashboardFetch<ResolvedAccount>(
    `${base(guildId)}/resolve`,
    { method: "POST", json: { platform, input } },
    { timeoutMs: RESOLVE_TIMEOUT_MS },
  )
}

/** push 只有 YouTube 才有：failed 表示設定已存入但推播訂閱失敗 */
export interface SaveResult {
  ok: true
  push?: "ok" | "pending" | "failed"
}

export function createCommunityNotifies(
  guildId: string,
  platform: CommunityPlatform,
  accountId: string,
  notifyTypes: string[],
  values: ChannelNotifyValues,
): Promise<SaveResult> {
  return dashboardFetch<SaveResult>(
    base(guildId),
    { method: "POST", json: { platform, account_id: accountId, notify_types: notifyTypes, values } },
    { timeoutMs: WRITE_TIMEOUT_MS },
  )
}

export function updateCommunityNotify(
  guildId: string,
  key: string,
  accountId: string,
  values: ChannelNotifyValues,
  original: ChannelNotifyValues,
): Promise<SaveResult> {
  return dashboardFetch<SaveResult>(
    itemPath(guildId, key, accountId),
    { method: "PUT", json: { values, original } },
    { timeoutMs: WRITE_TIMEOUT_MS },
  )
}

export function deleteCommunityNotify(
  guildId: string,
  key: string,
  accountId: string,
  original: ChannelNotifyValues,
): Promise<void> {
  return dashboardFetch(itemPath(guildId, key, accountId), { method: "DELETE", json: { original } })
}

export type CommunityProblem =
  | { kind: "conflict"; deleted: boolean; current: ChannelNotifyValues | null }
  | { kind: "already_exists"; existing: string[]; current: Record<string, ChannelNotifyValues> }
  | { kind: "invalid_field"; field: string; reason: string }
  | { kind: "resolve_failed"; reason: ResolveFailure }

export function parseCommunityProblem(e: unknown): CommunityProblem | null {
  if (!(e instanceof DashboardApiError) || !e.body) return null
  const body = e.body as {
    deleted?: boolean
    current?: unknown
    existing?: string[]
    field?: string
    reason?: string
  }
  switch (e.code) {
    case "conflict":
      return {
        kind: "conflict",
        deleted: body.deleted === true,
        current: (body.current as ChannelNotifyValues | null | undefined) ?? null,
      }
    case "already_exists":
      return {
        kind: "already_exists",
        existing: body.existing ?? [],
        current: (body.current as Record<string, ChannelNotifyValues> | undefined) ?? {},
      }
    case "invalid_field":
      return body.field && body.reason ? { kind: "invalid_field", field: body.field, reason: body.reason } : null
    case "resolve_failed":
      return body.reason && body.reason in RESOLVE_FAILURE_TEXT
        ? { kind: "resolve_failed", reason: body.reason as ResolveFailure }
        : null
    default:
      return null
  }
}
