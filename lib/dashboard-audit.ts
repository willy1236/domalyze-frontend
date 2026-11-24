// 頻道設定的修改紀錄：營運入口與頻道後台共用的型別與顯示文字。

import { enforcementFilterLabel } from "./dashboard-enforcement"

export interface AuditEntry {
  id: number
  at: string
  /** 頻道後台的回應不帶操作者的 id，營運入口有 */
  actor: { platform: "twitch" | "discord" | "domalyze"; id?: string; name: string }
  source: "dashboard" | "chat"
  target_kind: string
  target_key: string
  action: "create" | "update" | "delete"
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

/** 一頁修改紀錄；營運入口的回應另外帶頻道資料 */
export interface AuditEntriesPage {
  entries: AuditEntry[]
  page: number
  has_next: boolean
}

const TARGET_KINDS: Record<string, string> = {
  command: "自訂指令",
  timer: "計時訊息",
  event_response: "事件回應",
  forward: "轉發",
  channel: "頻道",
  mod_collab: "mod 協作開關",
  moderation: "聊天室管理設定",
  blocked_term: "Twitch 禁用詞",
  regular: "常客",
  stream_info: "實況資訊",
  enforcement: "執法紀錄",
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

const STREAM_KEYS: Record<string, string> = { title: "標題", category: "分類", game: "分類", stream: "標題與分類" }

function targetKey(entry: AuditEntry): string {
  const { target_kind: kind, target_key: key } = entry
  if (kind === "channel" && Object.hasOwn(CHANNEL_KEYS, key)) return CHANNEL_KEYS[key]
  if (kind === "moderation") return key === "channel" || key === "settings" ? "頻道處罰設定" : enforcementFilterLabel(key)
  if (kind === "stream_info" && Object.hasOwn(STREAM_KEYS, key)) return STREAM_KEYS[key]
  const snapshot = entry.after ?? entry.before
  const label = kind === "regular" || kind === "enforcement"
    ? snapshot?.user_name || snapshot?.user_login
    : kind === "blocked_term" ? snapshot?.text : undefined
  return typeof label === "string" && label ? label : key
}

/** 修改紀錄一列的可讀文字；不認得的代碼直接顯示代碼 */
export function auditLabels(entry: AuditEntry): { target: string; action: string; source: string; actor: string } {
  const kind = Object.hasOwn(TARGET_KINDS, entry.target_kind) ? TARGET_KINDS[entry.target_kind] : entry.target_kind
  const key = targetKey(entry)
  // mod 協作開關只有一個 key，不再顯示 key
  const target = entry.target_kind === "mod_collab" && entry.target_key === "enabled" ? kind : `${kind}：${key}`
  return {
    target,
    action: ACTIONS[entry.action] ?? entry.action,
    source: SOURCES[entry.source] ?? entry.source,
    actor: `${PLATFORMS[entry.actor.platform] ?? entry.actor.platform} ${entry.actor.name}`,
  }
}
