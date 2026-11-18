import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import { sectionBasePath } from "./dashboard-sections"

export type PollStatus = "active" | "ended"
export type ChannelState = "ok" | "unknown" | "missing"
export type ResultsVisibility = "everyone" | "creator_only" | "after_end"

export interface PollSummary {
  id: number
  title: string
  status: PollStatus
  voter_count: number
  creator_id: string
  /** 發起人已離開伺服器時為 null */
  creator_name: string | null
  channel_id: string | null
  /** channel_state 不是 ok 時為 null */
  channel_name: string | null
  /** unknown：舊投票沒有記頻道；missing：頻道已不存在 */
  channel_state: ChannelState
  /** 星羽在投票頻道缺少的權限名稱（中文），齊全為空陣列；channel_state 不是 ok 時為 null */
  missing_permissions: string[] | null
  /** channel_state 不是 ok 時為 null */
  message_url: string | null
  created_at: string
  ended_at: string | null
  deadline: string | null
}

export interface PollsResponse {
  polls: PollSummary[]
  page: number
  has_next: boolean
  all: boolean
  recent_days: number
}

export interface PollRoleRef {
  id: string
  /** 身分組已刪除時為 null */
  name: string | null
}

export interface PollOption {
  option_id: number
  name: string
}

export interface PollCount extends PollOption {
  /** 加權後票數 */
  count: number
}

export interface PollVote {
  user_id: string
  name: string | null
  /** 已離開伺服器 */
  left: boolean
  option_id: number
  weight: number
  voted_at: string
}

export interface PollDetail extends PollSummary {
  show_name: boolean
  results_visibility: ResultsVisibility
  number_of_user_votes: number
  only_roles: PollRoleRef[]
  role_weights: (PollRoleRef & { weight: number })[]
  options: PollOption[]
  /** 看不到票數時為 null */
  counts: PollCount[] | null
  /** 看不到票數或匿名時為 null */
  votes: PollVote[] | null
  viewer: { role: "creator" | "member"; can_manage: boolean }
  message_failure: string | null
  message_failure_text: string | null
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/polls`


export function pollHref(guildId: string, pollId: number): string {
  return `${sectionBasePath(guildId)}/polls/${pollId}`
}

export function fetchPolls(
  guildId: string,
  opts: { all: boolean; page: number },
  signal?: AbortSignal,
): Promise<PollsResponse> {
  const params = new URLSearchParams({ page: String(opts.page) })
  if (opts.all) params.set("all", "true")
  return dashboardFetch<PollsResponse>(`${base(guildId)}?${params.toString()}`, {}, { signal })
}

export function fetchPoll(guildId: string, id: number, signal?: AbortSignal): Promise<PollDetail> {
  return dashboardFetch<PollDetail>(`${base(guildId)}/${id}`, {}, { signal })
}

/** 「年/月/日 時:分」，固定台北時區；timeZone 讓測試能覆寫 */
export function formatDateTime(iso: string, timeZone = "Asia/Taipei"): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso))
}

export function statusLabel(status: PollStatus): string {
  return status === "active" ? "進行中" : "已結算"
}

/** 頻道欄位文字：頻道未知與已不存在各自標示 */
export function channelLabel(p: Pick<PollSummary, "channel_state" | "channel_name">): string {
  if (p.channel_state === "unknown") return "頻道未知"
  if (p.channel_state === "missing") return "頻道已不存在"
  return p.channel_name ? `#${p.channel_name}` : "頻道未知"
}

/** 星羽在投票頻道缺少權限時的警告；權限齊全或頻道不是 ok（null）時回傳 null */
export function missingPermissionsText(missing: string[] | null): { short: string; full: string } | null {
  if (!missing || missing.length === 0) return null
  const names = missing.join("、")
  return {
    short: `星羽缺少頻道權限：${names}`,
    full: `星羽在此頻道缺少：${names}。結算與刪除時會無法更新或刪除投票訊息，請到頻道設定補上。`,
  }
}

/** 看不到票數時的說明（可見時回 null） */
export function hiddenResultsText(detail: Pick<PollDetail, "status" | "results_visibility" | "counts">): string | null {
  if (detail.counts) return null
  if (detail.status === "ended") return "這個投票沒有可顯示的結果。"
  if (detail.results_visibility === "creator_only") return "結果僅限發起人預先查看，結算後公佈。"
  return "結果將在結算後公佈。"
}

export function visibilityLabel(v: ResultsVisibility): string {
  if (v === "everyone") return "所有人都能預先查看結果"
  if (v === "creator_only") return "僅限發起人能預先查看結果"
  return "結果將在結束時公佈"
}

export function roleLabel(r: PollRoleRef): string {
  return r.name ?? "已刪除的身分組"
}

/** 投票人顯示名稱：已離開優先標示；否則用名稱，再退回 ID */
export function voterLabel(v: Pick<PollVote, "user_id" | "name" | "left">): string {
  if (v.left) return `已離開的成員（${v.user_id}）`
  return v.name || v.user_id
}

/** 投票不存在或屬於其他伺服器（404）：不是暫時性錯誤，不提供重試 */
export function isNotFound(error: unknown): boolean {
  return error instanceof DashboardApiError && error.status === 404
}
