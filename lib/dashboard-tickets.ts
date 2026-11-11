import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import {
  emptyMessage,
  parseFieldErrors,
  validateMessage,
  type FieldError,
  type MessageContent,
  type PreviewButton,
} from "./dashboard-message"

export type TicketStatus = "open" | "locked"

/** 大廳失效的原因；同時有多項只會回第一個（頻道、分類、訊息的順序）。 */
export type LobbyInvalidReason = "channel_deleted" | "category_deleted" | "message_deleted"

/** 名稱為 null 代表已離開伺服器 */
export interface TicketMember {
  id: string
  name: string | null
}

export interface TicketItem {
  /** name 為 null 代表頻道已不存在（正常情況下載入時會移除紀錄，不會出現） */
  channel: { id: string; name: string | null }
  jump_url: string
  creator: TicketMember | null
  /** ISO 字串 */
  created_at: string
  /** 流水號；測試版建立的頻道為 null */
  number: number | null
  status: TicketStatus
  /** 只有已鎖定的有值 */
  closer: TicketMember | null
  closed_at: string | null
}

export interface ManagerRole {
  id: string
  /** 身分組已被刪除時為 null */
  name: string | null
  invalid: boolean
}

export interface TicketPermissionIssue {
  permission: string
  /** 檢查的位置：私人頻道所在的分類，或大廳頻道 */
  target: "category" | "lobby_channel"
  consequence: string
}

export interface TicketLobby {
  channel: { id: string; name: string | null; invalid: boolean }
  jump_url: string
  message_invalid: boolean
  category: { id: string | null; name: string | null; invalid: boolean }
  invalid_reason: LobbyInvalidReason | null
  manager_roles: ManagerRole[]
  name_prefix: string
  one_per_user: boolean
  /** 同時開啟上限；null 為不限 */
  max_open: number | null
  /** 所有還沒刪除的私人頻道，包括已鎖定的（都占名額） */
  ticket_count: number
  locked_count: number
  permission_issues: TicketPermissionIssue[]
  tickets: TicketItem[]
}

export interface TicketsResponse {
  lobbies: TicketLobby[]
  /** 對不到大廳的私人頻道 */
  unassigned: TicketItem[]
}

export function fetchTickets(guildId: string, signal?: AbortSignal): Promise<TicketsResponse> {
  return dashboardFetch<TicketsResponse>(`/dashboard/guilds/${encodeURIComponent(guildId)}/tickets`, {}, { signal })
}

/** 大廳失效的說明，沒有失效回 null。 */
export function lobbyInvalidMessage(reason: LobbyInvalidReason | null): string | null {
  switch (reason) {
    case "channel_deleted":
      return "大廳頻道已被刪除"
    case "category_deleted":
      return "私人頻道所在的分類已被刪除或尚未設定，必須重新選分類才能再開單"
    case "message_deleted":
      return "大廳訊息已被刪除，成員無法從大廳開單"
    default:
      return null
  }
}

/** 權限警告的位置說明。 */
export function targetLabel(target: TicketPermissionIssue["target"]): string {
  return target === "category" ? "私人頻道所在分類" : "大廳頻道"
}

/** 成員顯示文字：離開伺服器的只顯示 ID。 */
export function memberLabel(member: TicketMember | null): string {
  if (!member) return "未知"
  return member.name ?? `${member.id}（已離開伺服器）`
}

/** 開單限制的說明：每人一張與同時開啟上限。 */
export function limitSummary(lobby: Pick<TicketLobby, "one_per_user" | "max_open">): string {
  const parts = [lobby.one_per_user ? "每人一張" : "每人不限張數"]
  parts.push(lobby.max_open === null ? "不限同時開啟上限" : `同時開啟上限 ${lobby.max_open} 張`)
  return parts.join("，")
}

// ====== P-02：新增、修改、移除大廳 ======

/** 開單按鈕的預設文字 */
export const DEFAULT_BUTTON_LABEL = "建立私人頻道"
/** 前綴（處理後）的最大長度 */
export const MAX_PREFIX = 20
/** Discord 按鈕 label 上限 */
export const MAX_BUTTON_LABEL = 80
/** 同時開啟上限的最大值 */
export const MAX_OPEN_LIMIT = 10000
/** 新建頻道的名稱上限 */
export const MAX_CHANNEL_NAME = 100

export interface LobbyPermissionIssue {
  permission: string
  target: "category" | "lobby_channel"
  consequence: string
}

export interface LobbyChannelOption {
  id: string
  name: string
  category: string | null
  permission_issues: LobbyPermissionIssue[]
}

export interface LobbyCategoryOption {
  id: string
  name: string
  permission_issues: LobbyPermissionIssue[]
}

export interface ManagerRoleOption {
  id: string
  name: string
  color: number
  /** 不能選的原因（@everyone、整合服務管理）；可以選為 null */
  disabled_reason: string | null
}

export interface LobbyEmojiOption {
  id: string
  name: string
  animated: boolean
  /** 存進按鈕的字串，例如 `<:name:123>` */
  value: string
}

export interface LobbyOptions {
  channels: LobbyChannelOption[]
  categories: LobbyCategoryOption[]
  roles: ManagerRoleOption[]
  emojis: LobbyEmojiOption[]
}

/** 衝突比對用的設定快照（`GET .../lobbies/{id}` 的 original，原樣送回） */
export interface LobbyOriginal {
  ticket_category_id: string | null
  name_prefix: string
  one_per_user: boolean
  max_open: number | null
  content_json: string | null
  button_label: string | null
  button_emoji: string | null
  manager_role_ids: string[]
}

export interface LobbyDetail {
  channel: { id: string; name: string | null }
  invalid_reason: LobbyInvalidReason | null
  ticket_category_id: string | null
  manager_role_ids: string[]
  name_prefix: string
  one_per_user: boolean
  max_open: number | null
  content: MessageContent
  button_label: string | null
  button_emoji: string | null
  original: LobbyOriginal
}

export type LobbyChannelChoice =
  | { kind: "existing"; id: string }
  | { kind: "new"; name: string; category_id: string }

/** 送出的大廳設定（新增與修改相同；修改另加 original） */
export interface LobbyRequest {
  lobby_channel: LobbyChannelChoice
  ticket_category_id: string
  manager_role_ids: string[]
  name_prefix: string
  one_per_user: boolean
  max_open: number | null
  message: MessageContent
  button_label: string | null
  button_emoji: string | null
}

export interface LobbySaveResult {
  channel_id: string
  message_id: string
  jump_url: string
  /** 套用管理身分組失敗的私人頻道；大廳設定仍已存檔 */
  failures: { channel_id: string; reason: string }[]
}

/** 表單暫存：還原時回到同一份原始值與使用者已輸入的內容 */
export interface LobbyFormDraft {
  /** 被編輯的大廳頻道 ID；null 表示新增 */
  lobbyId: string | null
  original: LobbyOriginal | null
  channelKind: "existing" | "new"
  channelId: string | null
  newName: string
  newCategoryId: string | null
  ticketCategoryId: string | null
  managerRoleIds: string[]
  namePrefix: string
  onePerUser: boolean
  maxOpen: string
  message: MessageContent
  buttonLabel: string
  buttonEmoji: string | null
}

export const TICKET_DRAFT_KEY = "tickets:form"

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/tickets`
const lobbyPath = (guildId: string, channelId: string) => `${base(guildId)}/lobbies/${encodeURIComponent(channelId)}`

export function fetchLobbyOptions(guildId: string, signal?: AbortSignal): Promise<LobbyOptions> {
  return dashboardFetch<LobbyOptions>(`${base(guildId)}/options`, {}, { signal })
}

export function fetchLobbyDetail(guildId: string, channelId: string, signal?: AbortSignal): Promise<LobbyDetail> {
  return dashboardFetch<LobbyDetail>(lobbyPath(guildId, channelId), {}, { signal })
}

export function createLobby(guildId: string, body: LobbyRequest): Promise<LobbySaveResult> {
  return dashboardFetch(`${base(guildId)}/lobbies`, { method: "POST", json: body })
}

export function updateLobby(
  guildId: string,
  channelId: string,
  body: LobbyRequest & { original: LobbyOriginal },
): Promise<LobbySaveResult> {
  return dashboardFetch(lobbyPath(guildId, channelId), { method: "PUT", json: body })
}

export function removeLobby(guildId: string, channelId: string, original: LobbyOriginal): Promise<{ removed: true }> {
  return dashboardFetch(lobbyPath(guildId, channelId), { method: "DELETE", json: { original } })
}

/** 與後端 `normalize_prefix` 相同的處理：轉小寫、空白換成 `-`、只留字母數字、`-`、`_`，合併連續的 `-`、去頭尾的 `-` */
export function normalizePrefix(raw: string): string {
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
  return text.replace(/-{2,}/gu, "-").replace(/^-+|-+$/gu, "")
}

/** 前綴處理後不是 1 到 20 個字元時的說明；合格回 null */
export function prefixProblem(raw: string): string | null {
  const length = [...normalizePrefix(raw)].length
  if (length < 1 || length > MAX_PREFIX) return `處理後必須是 1 到 ${MAX_PREFIX} 個字元（目前 ${length} 個）`
  return null
}

/** 大廳表單的前端驗證結果：key 是欄位名稱，值是原因；訊息欄位的錯誤另放 message */
export interface LobbyFormErrors {
  fields: Record<string, string>
  message: FieldError[]
}

export interface LobbyFormValues {
  channelKind: "existing" | "new"
  channelId: string | null
  newName: string
  newCategoryId: string | null
  ticketCategoryId: string | null
  namePrefix: string
  maxOpen: string
  buttonLabel: string
  message: MessageContent
  /** 是否必須指定大廳頻道（新增，或失效的大廳重選頻道） */
  needsChannel: boolean
}

/** 解析「同時開啟上限」輸入：空白代表不限；不合法回 undefined */
export function parseMaxOpen(raw: string): number | null | undefined {
  const text = raw.trim()
  if (text === "") return null
  if (!/^\d+$/u.test(text)) return undefined
  const n = Number(text)
  return n >= 1 && n <= MAX_OPEN_LIMIT ? n : undefined
}

export function validateLobbyForm(v: LobbyFormValues): LobbyFormErrors {
  const fields: Record<string, string> = {}
  if (v.needsChannel) {
    if (v.channelKind === "existing") {
      if (!v.channelId) fields.lobby_channel = "請選擇大廳頻道"
    } else {
      if (!v.newName.trim() || [...v.newName.trim()].length > MAX_CHANNEL_NAME) {
        fields["lobby_channel.name"] = `頻道名稱必須是 1 到 ${MAX_CHANNEL_NAME} 個字元`
      }
      if (!v.newCategoryId) fields["lobby_channel.category_id"] = "請選擇新頻道所在的分類"
    }
  }
  if (!v.ticketCategoryId) fields.ticket_category_id = "請選擇私人頻道所在的分類"
  const prefix = prefixProblem(v.namePrefix)
  if (prefix) fields.name_prefix = prefix
  if (parseMaxOpen(v.maxOpen) === undefined) fields.max_open = `請填 1 到 ${MAX_OPEN_LIMIT} 的整數，不限制請留空`
  if ([...v.buttonLabel.trim()].length > MAX_BUTTON_LABEL) fields.button_label = `不能超過 ${MAX_BUTTON_LABEL} 字`
  return { fields, message: validateMessage(v.message) }
}

export function hasLobbyErrors(e: LobbyFormErrors): boolean {
  return e.message.length > 0 || Object.keys(e.fields).length > 0
}

/** 後端回報的欄位錯誤分到一般欄位與訊息編輯器；`manager_role_ids.N` 歸入 manager_role_ids */
export function splitLobbyFieldErrors(fields: FieldError[]): LobbyFormErrors {
  const result: LobbyFormErrors = { fields: {}, message: [] }
  for (const f of fields) {
    if (f.path === "content" || f.path.startsWith("embed.")) result.message.push(f)
    else {
      const key = f.path.startsWith("manager_role_ids.") ? "manager_role_ids" : f.path
      result.fields[key] = result.fields[key] ? `${result.fields[key]}；${f.reason}` : f.reason
    }
  }
  return result
}

export type LobbySaveProblem =
  | { kind: "conflict"; latest: LobbyDetail | null }
  | { kind: "invalid"; fields: FieldError[] }
  | { kind: "discord_error"; text: string }
  | { kind: "save_failed" }
  | { kind: "guild_unavailable" }
  | { kind: "not_found" }

/** 把存檔的 API 錯誤分類；不是已知的錯誤（含 wrapper 已處理的）回 null */
export function parseLobbySaveProblem(e: unknown): LobbySaveProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  const body = e.body ?? {}
  switch (e.code) {
    case "conflict":
      return { kind: "conflict", latest: body.deleted ? null : ((body.current as LobbyDetail | null) ?? null) }
    case "invalid_request": {
      const parsed = parseFieldErrors(e)
      return parsed ? { kind: "invalid", fields: parsed } : null
    }
    case "discord_error":
      return { kind: "discord_error", text: String(body.message ?? "") }
    case "save_failed":
      return { kind: "save_failed" }
    case "guild_unavailable":
      return { kind: "guild_unavailable" }
    case "lobby_not_found":
      return { kind: "not_found" }
    default:
      return null
  }
}

/** 預設的大廳訊息編輯起點（新增時） */
export function newLobbyMessage(): MessageContent {
  const message = emptyMessage()
  message.embed = {
    title: null,
    url: null,
    description: "點擊下方按鈕以建立私人頻道",
    color: 0xc4e9ff,
    author: { name: "私人頻道系統", url: null, icon_url: null },
    fields: [],
    image_url: null,
    thumbnail_url: null,
    footer: null,
    extra: {},
  }
  return message
}

/** 預覽用的開單按鈕 */
export function lobbyPreviewButtons(label: string, emoji: string | null): PreviewButton[] {
  return [{ label: label.trim() || DEFAULT_BUTTON_LABEL, emoji: emoji ? emojiText(emoji) : null, style: "primary" }]
}

/** 按鈕 emoji 的顯示文字：Unicode emoji 原樣，自訂 emoji（`<:name:id>`）顯示成 `:name:` */
export function emojiText(emoji: string): string {
  const m = /^<a?:(\w+):\d+>$/u.exec(emoji)
  return m ? `:${m[1]}:` : emoji
}

/** 前綴實際會變成的頻道名稱範例 */
export function prefixExample(raw: string): string {
  const p = normalizePrefix(raw)
  return p ? `${p}-0001` : ""
}

/** 衝突提示（ConflictNotice）要顯示的值 */
export function lobbyConflictValues(v: {
  namePrefix: string
  managerRoleNames: string[]
  onePerUser: boolean
  maxOpen: number | null
  message: MessageContent
  buttonLabel: string | null
}): Record<string, string | null> {
  const c = v.message
  const parts = [c.content?.trim(), c.embed?.title?.trim(), c.embed?.description?.trim()].filter(Boolean) as string[]
  return {
    name_prefix: v.namePrefix,
    manager_roles: v.managerRoleNames.length > 0 ? v.managerRoleNames.map((n) => `@${n}`).join("、") : "（無）",
    limits: limitSummary({ one_per_user: v.onePerUser, max_open: v.maxOpen }),
    message: parts.length > 0 ? parts.join("\n") : "（空白）",
    button_label: v.buttonLabel || DEFAULT_BUTTON_LABEL,
  }
}

/** 套用管理身分組失敗時，畫面提示的頻道名稱 */
export function failureLabel(f: { channel_id: string }, names: Record<string, string | null | undefined>): string {
  return names[f.channel_id] ? `#${names[f.channel_id]}` : `頻道 ${f.channel_id}`
}
