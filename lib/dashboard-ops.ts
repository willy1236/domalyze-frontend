// bot owner 的營運入口：頻道清單、停權與解除停權、修改紀錄。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import type { ChannelState } from "./dashboard-channel"
import type { ChannelHealth } from "./dashboard-channel-health"

export const OPS_PATH = "/dashboard/ops"

export function opsAuditPath(channelId: string): string {
  return `${OPS_PATH}/channels/${encodeURIComponent(channelId)}`
}

/** 停權理由的字數上限；與後端 `REASON_MAX` 一致 */
export const BAN_REASON_MAX = 500

/** 清單同時補查 health 的上限：每次判定可能續期實況主 token、佔著後台的 DB 連線，不能一次全送 */
export const HEALTH_CONCURRENCY = 3

export interface OpsChannel {
  id: string
  login: string | null
  name: string
  avatar_url: string | null
  state: ChannelState
  banned_at: string | null
  banned_reason: string | null
  first_seen_at: string | null
}

export interface OpsChannelPage {
  channels: OpsChannel[]
  page: number
  page_size: number
  total: number
}

export interface BanResult {
  channel: OpsChannel
  /** 星羽沒有完成同步（離線或內部出錯）；已停權，上線後依資料庫為準 */
  bot_offline: boolean
}

export interface AuditEntry {
  id: number
  at: string
  actor: { platform: "twitch" | "discord" | "domalyze"; id: string; name: string }
  source: "dashboard" | "chat"
  target_kind: string
  target_key: string
  action: "create" | "update" | "delete"
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export interface AuditPage {
  channel: OpsChannel
  entries: AuditEntry[]
  page: number
  has_next: boolean
}

const channelUrl = (channelId: string) => `/dashboard/ops/channels/${encodeURIComponent(channelId)}`

export function fetchOpsChannels(page: number, signal?: AbortSignal): Promise<OpsChannelPage> {
  return dashboardFetch(`/dashboard/ops/channels?page=${page}`, {}, { signal })
}

export function fetchOpsHealth(channelId: string, signal?: AbortSignal): Promise<ChannelHealth> {
  return dashboardFetch(`${channelUrl(channelId)}/health`, {}, { signal })
}

export function fetchOpsAudit(channelId: string, page: number, signal?: AbortSignal): Promise<AuditPage> {
  return dashboardFetch(`${channelUrl(channelId)}/audit?page=${page}`, {}, { signal })
}

export function banChannel(channelId: string, reason: string): Promise<BanResult> {
  return dashboardFetch(`${channelUrl(channelId)}/ban`, { method: "POST", json: { reason } })
}

export function unbanChannel(channelId: string): Promise<{ channel: OpsChannel }> {
  return dashboardFetch(`${channelUrl(channelId)}/unban`, { method: "POST" })
}

/** 不是 bot owner；不在全域處理，由營運頁自己顯示 */
export function isNotBotOwner(error: unknown): boolean {
  return error instanceof DashboardApiError && error.code === "not_bot_owner"
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/** 停權後的提示：星羽沒有完成同步時，已停權但還在聊天室，要等它上線才會離開 */
export function banNotice(result: BanResult): string {
  return result.bot_offline ? "已停權，但星羽暫時離線，上線後會離開聊天室。" : "已停權。"
}

/**
 * 同時最多跑 `limit` 個任務，其餘排隊；排隊中的任務在 signal 中止後不再開始。
 * 營運清單用它限制逐列補查 health 的並行數。
 */
export function createLimiter(limit: number) {
  let active = 0
  const queue: (() => void)[] = []

  function next() {
    while (active < limit && queue.length > 0) {
      active += 1
      queue.shift()?.()
    }
  }

  return function run<T>(task: () => Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        if (signal.aborted) {
          active -= 1
          reject(new DOMException("Aborted", "AbortError"))
          next()
          return
        }
        task()
          .then(resolve, reject)
          .finally(() => {
            active -= 1
            next()
          })
      })
      next()
    })
  }
}

const TARGET_KINDS: Record<string, string> = {
  command: "自訂指令",
  timer: "計時訊息",
  event_response: "事件回應",
  forward: "轉發",
  channel: "頻道",
}

const CHANNEL_KEYS: Record<string, string> = {
  all_data: "刪除所有資料",
  ban: "停權",
  unban: "解除停權",
}

const ACTIONS: Record<AuditEntry["action"], string> = { create: "新增", update: "修改", delete: "刪除" }

const SOURCES: Record<AuditEntry["source"], string> = { dashboard: "後台", chat: "聊天室" }

const PLATFORMS: Record<AuditEntry["actor"]["platform"], string> = {
  twitch: "Twitch",
  discord: "Discord",
  domalyze: "析域",
}

/** 修改紀錄一列的可讀文字；不認得的代碼直接顯示代碼 */
export function auditLabels(entry: AuditEntry): { target: string; action: string; source: string; actor: string } {
  const kind = Object.hasOwn(TARGET_KINDS, entry.target_kind) ? TARGET_KINDS[entry.target_kind] : entry.target_kind
  const key =
    entry.target_kind === "channel" && Object.hasOwn(CHANNEL_KEYS, entry.target_key)
      ? CHANNEL_KEYS[entry.target_key]
      : entry.target_key
  return {
    target: `${kind}：${key}`,
    action: ACTIONS[entry.action] ?? entry.action,
    source: SOURCES[entry.source] ?? entry.source,
    actor: `${PLATFORMS[entry.actor.platform] ?? entry.actor.platform} ${entry.actor.name}`,
  }
}
