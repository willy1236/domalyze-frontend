import { dashboardFetch } from "./dashboard-api"

export type WarningKind = "warning" | "timeout" | "kick" | "ban"

export const WARNING_KINDS: readonly WarningKind[] = ["warning", "timeout", "kick", "ban"]

const KIND_LABELS: Record<WarningKind, string> = {
  warning: "警告",
  timeout: "禁言",
  kick: "踢出",
  ban: "停權",
}

export function kindLabel(kind: WarningKind): string {
  return KIND_LABELS[kind]
}

export interface WarningPerson {
  id: string
  /** 已離開伺服器時為 null */
  name: string | null
  avatar_url: string | null
  left: boolean
}

export interface WarningRecord {
  id: number
  kind: WarningKind
  target: WarningPerson
  moderator: WarningPerson
  reason: string | null
  /** ISO 字串 */
  created_at: string
  /** 禁言時長，其他種類為 null */
  duration_seconds: number | null
  /** 存入跨群系統的紀錄 */
  cross_guild: boolean
  /** 是否由這個伺服器發出；跨群查詢時可能是其他伺服器的紀錄 */
  this_guild: boolean
  /** 與 `/warning get` 相同的警告單內容 */
  sheet: { title: string | null; description: string | null }
}

export interface WarningsResponse {
  warnings: WarningRecord[]
  page: number
  page_size: number
  total: number
  has_next: boolean
}

export interface MemberRecordsResponse {
  member: WarningPerson
  warnings: WarningRecord[]
}

export interface MemberSearchResult {
  id: string
  name: string
  username: string
  avatar_url: string
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/warnings`

export function fetchWarnings(
  guildId: string,
  opts: { member: string | null; kind: WarningKind | null; page: number },
  signal?: AbortSignal,
): Promise<WarningsResponse> {
  const params = new URLSearchParams({ page: String(opts.page) })
  if (opts.member) params.set("member", opts.member)
  if (opts.kind) params.set("kind", opts.kind)
  return dashboardFetch<WarningsResponse>(`${base(guildId)}?${params.toString()}`, {}, { signal })
}

export function fetchMemberRecords(guildId: string, userId: string, signal?: AbortSignal): Promise<MemberRecordsResponse> {
  return dashboardFetch<MemberRecordsResponse>(`${base(guildId)}/members/${encodeURIComponent(userId)}`, {}, { signal })
}

export async function searchMembers(guildId: string, q: string, signal?: AbortSignal): Promise<MemberSearchResult[]> {
  const res = await dashboardFetch<{ members: MemberSearchResult[] }>(
    `${base(guildId)}/member-search?${new URLSearchParams({ q }).toString()}`,
    {},
    { signal },
  )
  return res.members
}

/** 對象與執行者的顯示名稱：已離開的成員標示並附 ID，查不到名稱退回 ID */
export function personLabel(p: Pick<WarningPerson, "id" | "name" | "left">): string {
  if (p.left) return `已離開的成員（${p.id}）`
  return p.name || p.id
}

/** 禁言時長：「7 天」「1 小時 30 分鐘」「45 秒」 */
export function formatDuration(seconds: number): string {
  const units: [string, number][] = [
    ["天", 86400],
    ["小時", 3600],
    ["分鐘", 60],
    ["秒", 1],
  ]
  let rest = Math.max(0, Math.floor(seconds))
  const parts: string[] = []
  for (const [label, size] of units) {
    const n = Math.floor(rest / size)
    if (n > 0) {
      parts.push(`${n} ${label}`)
      rest -= n * size
    }
  }
  return parts.length > 0 ? parts.join(" ") : "0 秒"
}

/** 篩選成員輸入是否是可直接用的 Discord ID（純數字） */
export function isUserId(text: string): boolean {
  return /^\d{15,25}$/.test(text.trim())
}

const MEMBER_ERRORS: Record<string, string> = {
  not_member: "這位使用者目前不在這個伺服器，只能查詢伺服器內的成員。",
}

export function memberErrorText(code: string | null): string {
  return (code && MEMBER_ERRORS[code]) || "無法載入紀錄，請稍後再試。"
}
