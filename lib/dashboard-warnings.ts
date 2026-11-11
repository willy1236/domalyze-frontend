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
  bot: boolean
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

// ====== W-02：後台懲處 ======

/** 各種類在區塊權限裡對應的動作名稱（與後端 `SECTION_RULES` 一致） */
export const KIND_ACTION: Record<WarningKind, string> = {
  warning: "add",
  timeout: "timeout",
  kick: "kick",
  ban: "ban",
}

/** 使用者有權限的種類，順序同 WARNING_KINDS */
export function allowedKinds(can: (action: string) => boolean): WarningKind[] {
  return WARNING_KINDS.filter((k) => can(KIND_ACTION[k]))
}

/** 警告與停權可以直接填使用者 ID；禁言與踢出只能選伺服器內成員 */
export function allowsIdOnly(kind: WarningKind): boolean {
  return kind === "warning" || kind === "ban"
}

export const MAX_REASON_LENGTH = 100

/** 禁言時長與禁言刪訊息秒數的範圍，與後端一致（Discord 禁言上限 7 天） */
export const MIN_TIMEOUT_SECONDS = 60
export const MAX_TIMEOUT_SECONDS = 604800
export const MAX_DELETE_SECONDS = 604800

/** 自訂時長的單位 */
export const DURATION_UNITS: readonly { label: string; size: number }[] = [
  { label: "秒", size: 1 },
  { label: "分鐘", size: 60 },
  { label: "小時", size: 3600 },
  { label: "天", size: 86400 },
]

/** 數字＋單位轉成秒；不是有限數字（含空白）回 NaN */
export function toSeconds(amount: string, unitSize: number): number {
  const text = amount.trim()
  if (text === "") return NaN
  const n = Number(text)
  return Number.isFinite(n) ? n * unitSize : NaN
}

export const TIMEOUT_OPTIONS: readonly { seconds: number; label: string }[] = [
  { seconds: 60, label: "1 分鐘" },
  { seconds: 300, label: "5 分鐘" },
  { seconds: 600, label: "10 分鐘" },
  { seconds: 3600, label: "1 小時" },
  { seconds: 86400, label: "1 天" },
  { seconds: 259200, label: "3 天" },
  { seconds: 604800, label: "7 天" },
]

/** 刪除訊息的預設選項，與 `/ban` 的選項一致；停權只能選這組，禁言另可自訂 0–604800 秒 */
export const DELETE_MESSAGE_OPTIONS: readonly { seconds: number; label: string }[] = [
  { seconds: 0, label: "不要刪除訊息" },
  { seconds: 3600, label: "1 小時" },
  { seconds: 21600, label: "6 小時" },
  { seconds: 43200, label: "12 小時" },
  { seconds: 86400, label: "1 天" },
  { seconds: 259200, label: "3 天" },
  { seconds: 604800, label: "7 天" },
]

export interface PunishDraft {
  kind: WarningKind
  /** 對象的 Discord ID；沒選為 null */
  userId: string | null
  reason: string
  crossGuild: boolean
  durationSeconds: number
  deleteMessageSeconds: number
  announceChannelId: string
}

export type PunishFieldErrors = Partial<Record<"user" | "reason" | "duration" | "delete", string>>

/** 送出前的檢查，規則與後端一致（後端仍會再檢查一次）；回傳空物件代表可以送出。 */
export function validatePunish(draft: PunishDraft, selfId: string | null): PunishFieldErrors {
  const errors: PunishFieldErrors = {}
  if (!draft.userId) errors.user = "請選擇對象"
  else if (selfId !== null && draft.userId === selfId) errors.user = "不能對自己執行"
  const reason = draft.reason.trim()
  if (reason.length > MAX_REASON_LENGTH) errors.reason = `原因不得超過 ${MAX_REASON_LENGTH} 字`
  else if ((draft.kind === "warning" || draft.kind === "ban") && reason === "") errors.reason = "請填寫原因"
  if (draft.kind === "timeout") {
    const d = draft.durationSeconds
    if (!Number.isInteger(d) || d < MIN_TIMEOUT_SECONDS || d > MAX_TIMEOUT_SECONDS) {
      errors.duration = "禁言時長必須是 1 分鐘到 7 天之間的整數秒數"
    }
    const del = draft.deleteMessageSeconds
    if (!Number.isInteger(del) || del < 0 || del > MAX_DELETE_SECONDS) {
      errors.delete = "刪除訊息的範圍必須在 0 到 7 天（604800 秒）之間"
    }
  } else if (draft.kind === "ban" && !DELETE_MESSAGE_OPTIONS.some((o) => o.seconds === draft.deleteMessageSeconds)) {
    errors.delete = "請選擇刪除訊息的範圍"
  }
  return errors
}

export interface PunishRequest {
  kind: WarningKind
  user_id: string
  reason: string
  cross_guild: boolean
  duration_seconds?: number
  delete_message_seconds?: number
  announce_channel_id?: string
}

/** 草稿轉成 API body：只帶該種類用得到的欄位 */
export function buildPunishRequest(draft: PunishDraft): PunishRequest {
  const body: PunishRequest = {
    kind: draft.kind,
    user_id: draft.userId ?? "",
    reason: draft.reason.trim(),
    cross_guild: draft.crossGuild,
  }
  if (draft.kind === "timeout") body.duration_seconds = draft.durationSeconds
  if ((draft.kind === "timeout" || draft.kind === "ban") && draft.deleteMessageSeconds > 0) {
    body.delete_message_seconds = draft.deleteMessageSeconds
  }
  if (draft.announceChannelId) body.announce_channel_id = draft.announceChannelId
  return body
}

export interface PunishResult {
  ok: boolean
  error: string | null
  warning_id: number | null
  /** 停權時對象已被停權 */
  already: boolean
  deleted_summary: string | null
  auto_timeout: { ok: boolean; duration_seconds: number | null; error: string | null } | null
}

export interface PunishResponse {
  result: PunishResult
  announce_error: string | null
}

export interface AnnounceChannel {
  id: string
  name: string
}

export function punish(guildId: string, body: PunishRequest): Promise<PunishResponse> {
  return dashboardFetch<PunishResponse>(base(guildId), { method: "POST", json: body })
}

export async function fetchAnnounceChannels(guildId: string, signal?: AbortSignal): Promise<AnnounceChannel[]> {
  const res = await dashboardFetch<{ channels: AnnounceChannel[] }>(`${base(guildId)}/options`, {}, { signal })
  return res.channels
}

const PUNISH_ERRORS: Record<string, string> = {
  not_member: "禁言與踢出只能選伺服器內的成員。",
  user_not_found: "找不到這個使用者，請確認 ID。",
  no_permission: "你沒有執行這個動作的權限。",
}

/** 送出失敗（HTTP 錯誤）時給使用者看的文字；400 的欄位錯誤優先顯示後端指出的原因。 */
export function punishErrorText(code: string | null, fields?: unknown): string {
  if (code === "invalid_request" && Array.isArray(fields)) {
    const reasons = fields
      .map((f) => (f && typeof f === "object" && "reason" in f ? String((f as { reason: unknown }).reason) : ""))
      .filter(Boolean)
    if (reasons.length > 0) return reasons.join("；")
  }
  return (code && PUNISH_ERRORS[code]) || "送出失敗，請稍後再試。"
}

/** 懲處成功（含已被停權）或被 Discord／服務拒絕時的結果文字，依序列出每一項。 */
export function punishResultLines(kind: WarningKind, res: PunishResponse): { ok: boolean; lines: string[] } {
  const { result } = res
  if (!result.ok) return { ok: false, lines: [result.error ?? "執行失敗，沒有寫入紀錄。"] }
  const lines: string[] = []
  if (result.already) lines.push("這位使用者已經被停權，沒有重複執行，也沒有新增紀錄。")
  else if (result.warning_id !== null) lines.push(`已${kindLabel(kind)}，紀錄編號 ${result.warning_id}。`)
  else lines.push(`${result.error ?? "動作已執行，但紀錄寫入失敗"}。`)
  if (result.deleted_summary) lines.push(result.deleted_summary)
  if (result.auto_timeout) {
    const a = result.auto_timeout
    lines.push(a.ok ? `自動禁言：已禁言 ${formatDuration(a.duration_seconds ?? 0)}。` : `自動禁言失敗：${a.error ?? "未知原因"}`)
  }
  if (res.announce_error) lines.push(`紀錄已寫入，但公告失敗：${res.announce_error}`)
  return { ok: true, lines }
}

// ====== W-03：移除紀錄 ======

export interface RemoveWarningResponse {
  ok: true
  /** 紀錄原本就已不存在 */
  already?: boolean
}

/** 能否對這筆紀錄顯示移除：要有移除權限，且紀錄是這個伺服器發出的（其他伺服器的紀錄後端會拒絕） */
export function canRemoveRecord(can: (action: string) => boolean, record: Pick<WarningRecord, "this_guild">): boolean {
  return can("remove") && record.this_guild
}

export function removeWarning(guildId: string, warningId: number): Promise<RemoveWarningResponse> {
  return dashboardFetch<RemoveWarningResponse>(`${base(guildId)}/${warningId}`, { method: "DELETE" })
}

const REMOVE_ERRORS: Record<string, string> = {
  no_permission: "你沒有移除紀錄的權限。",
  not_this_guild: "這筆紀錄不是這個伺服器發出的，不能移除。",
}

export function removeErrorText(code: string | null): string {
  return (code && REMOVE_ERRORS[code]) || "移除失敗，請稍後再試。"
}
