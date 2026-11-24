// 聊天室執法紀錄：實況主頻道後台與營運入口共用的型別、顯示文字與請求。

import { dashboardFetch } from "./dashboard-api"

export type EnforcementAction = "delete" | "timeout" | "ban"

export interface EnforcementEntry {
  id: number
  at: string
  user_id: string
  user_login: string
  user_name: string
  filter: string
  /** 該觀眾在這個過濾器第幾次違規 */
  strike: number
  action: EnforcementAction
  /** 秒，只有 timeout 有 */
  duration: number | null
  message: string
  status: "ok" | "failed"
  lifted_at: string | null
}

export interface EnforcementPage {
  entries: EnforcementEntry[]
  has_next: boolean
}

export const ENFORCEMENT_PAGE_SIZE = 50

const FILTER_LABELS: Record<string, string> = {
  link: "連結",
  blocked_word: "禁字",
  caps: "大寫",
  emote: "表情符號過多",
  symbol: "符號過多",
  repetition: "重複內容",
  length: "訊息過長",
  duplicate: "跨訊息重複",
}

export function enforcementFilterLabel(filter: string): string {
  return FILTER_LABELS[filter] ?? filter
}

export function enforcementActionLabel(entry: Pick<EnforcementEntry, "action" | "duration">): string {
  switch (entry.action) {
    case "delete":
      return "刪除訊息"
    case "timeout":
      return `禁言 ${entry.duration ?? 0} 秒`
    case "ban":
      return "封鎖"
  }
}

/** 只有 timeout 與 ban 有處罰可以解除 */
export function canLift(entry: Pick<EnforcementEntry, "action">): boolean {
  return entry.action !== "delete"
}

export function fetchOpsEnforcement(
  channelId: string,
  offset: number,
  signal?: AbortSignal,
): Promise<EnforcementPage> {
  return dashboardFetch(`/dashboard/ops/channels/${encodeURIComponent(channelId)}/enforcement?offset=${offset}`, {}, { signal })
}

export type EnforcementOp = "lift" | "clear-strikes" | "regular"

export function fetchChannelEnforcement(channelId: string, offset: number, signal?: AbortSignal): Promise<EnforcementPage> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/enforcement?offset=${offset}`, {}, { signal })
}

export function runEnforcementOp(channelId: string, logId: number, op: EnforcementOp): Promise<{ result?: string } | undefined> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/enforcement/${logId}/${op}`, { method: "POST" })
}
