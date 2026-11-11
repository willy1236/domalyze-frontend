import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import {
  parseFieldErrors,
  readBackReasonText,
  validateMessage,
  type FieldError,
  type MessageContent,
  type PreviewButton,
} from "./dashboard-message"

export interface PermissionIssue {
  /** 缺少的權限名稱，例如 "Manage Roles" */
  permission: string
  scope: "guild" | "channel"
  /** 缺少時的後果 */
  consequence: string
}

export interface ReactionRoleButton {
  /** 身分組已刪除或 bot 無法發放時 invalid 為 true；已刪除時 name 為 null */
  role: { id: string; name: string | null; invalid: boolean }
  title: string
  emoji: string | null
  emoji_invalid: boolean
  style: number | null
}

export interface ReactionRoleMessage {
  message_id: string
  /** 頻道已刪除時 name 為 null */
  channel: { id: string; name: string | null; invalid: boolean }
  /** 訊息或頻道在 Discord 已不存在 */
  invalid: boolean
  /** 讀不到內容（已失效或缺權限）時為 null；空字串代表訊息沒有文字 */
  summary: string | null
  jump_url: string
  buttons: ReactionRoleButton[]
  permission_issues: PermissionIssue[]
}

export interface ReactionRolesResponse {
  messages: ReactionRoleMessage[]
}

export function fetchReactionRoles(guildId: string, signal?: AbortSignal): Promise<ReactionRolesResponse> {
  return dashboardFetch<ReactionRolesResponse>(
    `/dashboard/guilds/${encodeURIComponent(guildId)}/reaction-roles`,
    {},
    { signal },
  )
}

/** 整則訊息失效的原因文字；沒有失效回 null。頻道不在時訊息一定讀不到，只講頻道。 */
export function messageInvalidReason(message: ReactionRoleMessage): string | null {
  if (message.channel.invalid) return "頻道已被刪除"
  if (message.invalid) return "訊息已被刪除"
  return null
}

/** 按鈕失效的原因清單（身分組、emoji），沒有問題回空陣列。 */
export function buttonProblems(button: ReactionRoleButton): string[] {
  const problems: string[] = []
  if (button.role.invalid) {
    problems.push(
      button.role.name === null
        ? "身分組已被刪除"
        : "身分組無法發放（位階不低於 bot，或是 @everyone／整合服務身分組）",
    )
  }
  if (button.emoji_invalid) problems.push("自訂 emoji 已不存在")
  return problems
}

/** 按鈕 emoji 的顯示文字：Unicode emoji 原樣，自訂 emoji（`<:name:id>`）顯示成 `:name:`。 */
export function emojiLabel(emoji: string | null): string | null {
  if (!emoji) return null
  const m = /^<a?:(\w+):\d+>$/.exec(emoji)
  return m ? `:${m[1]}:` : emoji
}

/** 權限警告的位置說明。 */
export function scopeLabel(scope: PermissionIssue["scope"]): string {
  return scope === "guild" ? "伺服器" : "此頻道"
}

// ====== R-02：發新訊息與編輯 ======

/** 一則訊息最多幾顆按鈕（Discord 5 列 × 5 顆） */
export const MAX_BUTTONS = 25
/** 按鈕標題上限（Discord label） */
export const MAX_BUTTON_TITLE = 80

export interface RoleOption {
  id: string
  name: string
  color: number
  /** 不能選的原因；可以選為 null */
  disabled_reason: string | null
  dangerous: boolean
  /** 帶有的危險權限（discord.Permissions 屬性名稱） */
  dangerous_permissions: string[]
}

export interface ChannelOption {
  id: string
  name: string
  category: string | null
  permission_issues: PermissionIssue[]
}

export interface EmojiOption {
  id: string
  name: string
  animated: boolean
  /** 存進按鈕的字串，例如 `<:name:123>` */
  value: string
}

export interface ReactionRoleOptions {
  channels: ChannelOption[]
  roles: RoleOption[]
  emojis: EmojiOption[]
}

/** 編輯用的按鈕（GET /reaction-roles/{id}） */
export interface DetailButton extends ReactionRoleButton {
  role_id: string
  /** 位階不低於操作者：只能刪除，不能修改 */
  locked: boolean
  locked_reason: string | null
}

export interface ReactionRoleDetail {
  message_id: string
  channel: { id: string; name: string | null; invalid: boolean }
  /** 內容不能改（讀回失敗）時為 null */
  content: MessageContent | null
  /** 衝突比對用的原值 */
  content_json: string | null
  /** 內容不能改的原因代碼（multiple_embeds、has_attachments、message_unavailable），可改為 null */
  content_locked: string | null
  buttons: DetailButton[]
}

/** 請求與衝突比對用的按鈕快照 */
export interface ButtonSnapshot {
  role_id: string
  title: string
  emoji: string | null
  style: number | null
}

export interface OriginalSnapshot {
  content_json: string | null
  buttons: ButtonSnapshot[]
}

/** 表單裡的一顆按鈕；key 只用於 React 與排序，不送出 */
export interface FormButton {
  key: string
  /** 尚未選身分組為 null */
  role_id: string | null
  title: string
  emoji: string | null
  style: number
  /** 既有按鈕位階不低於操作者：只能刪除 */
  locked: boolean
}

/** 表單暫存的內容：還原時回到同一份原始值與使用者已輸入的內容 */
export interface ReactionRoleFormDraft {
  /** null 表示新增 */
  messageId: string | null
  /** 新增時的來源：發新訊息，或掛到既有訊息（已選定的那則）；舊暫存沒有此欄位，視為新訊息 */
  source?: "new" | "existing"
  existing?: { messageId: string; jumpUrl: string; summary: string } | null
  channelId: string | null
  original: OriginalSnapshot | null
  /** 內容不能改時為 null */
  message: MessageContent | null
  contentLocked: string | null
  buttons: FormButton[]
}

export const REACTION_ROLE_DRAFT_KEY = "reaction-roles:form"

export const STYLE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "主要（藍）" },
  { value: 2, label: "次要（灰）" },
  { value: 3, label: "成功（綠）" },
  { value: 4, label: "危險（紅）" },
]

const STYLE_NAMES: Record<number, NonNullable<PreviewButton["style"]>> = {
  1: "primary",
  2: "secondary",
  3: "success",
  4: "danger",
}

/** 常用的 Unicode emoji；其他 emoji 可選自訂的，或沿用既有按鈕已設定的值 */
export const UNICODE_EMOJIS = ["🎉", "🎮", "🎵", "📢", "📣", "🔔", "⭐", "❤️", "🔥", "✅", "❌", "👍", "🎨", "📚", "💬", "🍀"]

let keyCounter = 0
export function newButtonKey(): string {
  keyCounter += 1
  return `b${keyCounter}`
}

export function blankButton(): FormButton {
  return { key: newButtonKey(), role_id: null, title: "", emoji: null, style: 1, locked: false }
}

export function formButtonsFromDetail(buttons: DetailButton[]): FormButton[] {
  return buttons.map((b) => ({
    key: newButtonKey(),
    role_id: b.role_id,
    title: b.title,
    emoji: b.emoji,
    style: b.style ?? 1,
    locked: b.locked,
  }))
}

export function originalOf(detail: ReactionRoleDetail): OriginalSnapshot {
  return {
    content_json: detail.content_json,
    buttons: detail.buttons.map((b) => ({ role_id: b.role_id, title: b.title, emoji: b.emoji, style: b.style })),
  }
}

/** 送出用的按鈕；標題去頭尾空白 */
export function toRequestButtons(buttons: FormButton[]): ButtonSnapshot[] {
  return buttons.map((b) => ({ role_id: b.role_id ?? "", title: b.locked ? b.title : b.title.trim(), emoji: b.emoji, style: b.style }))
}

export function previewButtons(buttons: FormButton[]): PreviewButton[] {
  return buttons.map((b) => ({
    label: b.title.trim() || "（未命名）",
    emoji: emojiLabel(b.emoji),
    style: STYLE_NAMES[b.style] ?? "primary",
  }))
}

export type ButtonErrors = Record<string, string>

/** 前端先擋的按鈕錯誤，key 是按鈕的 key；整體錯誤放在 "_"。後端仍會再檢查。 */
export function validateButtons(buttons: FormButton[]): ButtonErrors {
  const errors: ButtonErrors = {}
  if (buttons.length === 0) errors._ = "至少要有一顆按鈕"
  else if (buttons.length > MAX_BUTTONS) errors._ = `按鈕不能超過 ${MAX_BUTTONS} 顆`
  const seen = new Set<string>()
  for (const b of buttons) {
    if (b.role_id === null) {
      errors[b.key] = "請選擇身分組"
      continue
    }
    if (seen.has(b.role_id)) errors[b.key] = "同一個身分組只能出現一次"
    else if (!b.locked) {
      if (!b.title.trim()) errors[b.key] = "標題不能空白"
      else if ([...b.title.trim()].length > MAX_BUTTON_TITLE) errors[b.key] = `標題不能超過 ${MAX_BUTTON_TITLE} 字`
    }
    seen.add(b.role_id)
  }
  return errors
}

/** 整份表單的前端驗證：訊息（內容沒鎖時）與按鈕 */
export function formErrors(
  message: MessageContent | null,
  buttons: FormButton[],
): { message: FieldError[]; buttons: ButtonErrors } {
  return { message: message ? validateMessage(message) : [], buttons: validateButtons(buttons) }
}

export function hasFormErrors(e: { message: FieldError[]; buttons: ButtonErrors }): boolean {
  return e.message.length > 0 || Object.keys(e.buttons).length > 0
}

/** 身分組選單中某個選項是否停用：已被其他按鈕選走，或有停用原因；這顆按鈕目前已選的值永遠可選 */
export function roleOptionState(
  role: RoleOption,
  current: FormButton,
  buttons: FormButton[],
): { disabled: boolean; reason: string | null } {
  if (current.role_id === role.id) return { disabled: false, reason: null }
  if (buttons.some((b) => b !== current && b.role_id === role.id)) return { disabled: true, reason: "已用於這則訊息的其他按鈕" }
  if (role.disabled_reason) return { disabled: true, reason: role.disabled_reason }
  return { disabled: false, reason: null }
}

const PERMISSION_LABELS: Record<string, string> = {
  administrator: "Administrator",
  manage_guild: "Manage Server",
  manage_roles: "Manage Roles",
  manage_channels: "Manage Channels",
  manage_webhooks: "Manage Webhooks",
  manage_messages: "Manage Messages",
  manage_nicknames: "Manage Nicknames",
  kick_members: "Kick Members",
  ban_members: "Ban Members",
  moderate_members: "Moderate Members",
  mention_everyone: "Mention Everyone",
  view_audit_log: "View Audit Log",
}

export function permissionLabel(name: string): string {
  return PERMISSION_LABELS[name] ?? name
}

/** 危險權限的警告文字；沒有危險權限回 null */
export function dangerNotice(role: RoleOption | undefined): string | null {
  if (!role?.dangerous) return null
  return `任何人按下按鈕都會取得這些權限：${role.dangerous_permissions.map(permissionLabel).join("、")}。仍可儲存。`
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/reaction-roles`

export function fetchReactionRoleOptions(guildId: string, signal?: AbortSignal): Promise<ReactionRoleOptions> {
  return dashboardFetch<ReactionRoleOptions>(`${base(guildId)}/options`, {}, { signal })
}

export function fetchReactionRoleDetail(
  guildId: string,
  messageId: string,
  signal?: AbortSignal,
): Promise<ReactionRoleDetail> {
  return dashboardFetch<ReactionRoleDetail>(`${base(guildId)}/${encodeURIComponent(messageId)}`, {}, { signal })
}

/** 發新訊息，或掛到 bot 既有的訊息 */
export type CreateTarget =
  | { kind: "new"; channel_id: string }
  | { kind: "existing"; channel_id: string; message_id: string }

export function createReactionRole(
  guildId: string,
  body: {
    target: CreateTarget
    /** 新訊息必填；掛到既有訊息且內容不能改時為 null */
    message: MessageContent | null
    buttons: ButtonSnapshot[]
  },
): Promise<{ message_id: string; jump_url: string }> {
  return dashboardFetch(base(guildId), { method: "POST", json: body })
}

// ====== R-03：掛到既有訊息 ======

export interface Candidate {
  message_id: string
  summary: string
  created_at: string
  /** free：可掛；reaction_role：已是反應身分組，點選後進入編輯 */
  status: "free" | "reaction_role"
}

export function fetchCandidates(guildId: string, channelId: string, signal?: AbortSignal): Promise<{ messages: Candidate[] }> {
  return dashboardFetch(`${base(guildId)}/candidates?channel_id=${encodeURIComponent(channelId)}`, {}, { signal })
}

export type ResolvedMessage =
  | { status: "reaction_role"; message_id: string; channel: { id: string; name: string }; jump_url: string; summary: string }
  | {
      status: "free"
      message_id: string
      channel: { id: string; name: string }
      jump_url: string
      summary: string
      /** 內容不能改時為 null */
      content: MessageContent | null
      content_locked: string | null
    }

export function resolveMessageLink(guildId: string, link: string, signal?: AbortSignal): Promise<ResolvedMessage> {
  return dashboardFetch(`${base(guildId)}/resolve?link=${encodeURIComponent(link)}`, {}, { signal })
}

/** 候選清單裡的訊息對應的連結（resolve 用） */
export function messageLink(guildId: string, channelId: string, messageId: string): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
}

const TARGET_REJECT_TEXT: Record<string, string> = {
  invalid_link: "這不是 Discord 訊息連結。",
  wrong_guild: "這則訊息不屬於這個伺服器。",
  not_bot_message: "只能掛在星羽發的訊息上。",
  has_components: "這則訊息已經帶有其他按鈕或互動元件，不能掛反應身分組。",
  message_not_found: "找不到這則訊息。",
  bot_missing_permission: "星羽看不到這個頻道的訊息，請確認有 View Channel 與 Read Message History。",
}

/** 選擇或解析既有訊息被擋下的原因文字；不是已知原因回 null */
export function targetRejectText(e: unknown): string | null {
  if (!(e instanceof DashboardApiError) || !e.code) return null
  return TARGET_REJECT_TEXT[e.code] ?? null
}

/** 掛上時發現訊息已是反應身分組：回該訊息 ID，供轉到編輯 */
export function alreadyReactionRoleId(e: unknown): string | null {
  if (e instanceof DashboardApiError && e.code === "already_reaction_role") {
    const id = e.body?.message_id
    return typeof id === "string" ? id : null
  }
  return null
}

export function updateReactionRole(
  guildId: string,
  messageId: string,
  body: { message: MessageContent | null; buttons: ButtonSnapshot[]; original: OriginalSnapshot },
): Promise<ReactionRoleDetail> {
  return dashboardFetch(`${base(guildId)}/${encodeURIComponent(messageId)}`, { method: "PUT", json: body })
}

export type SaveProblem =
  | { kind: "conflict"; latest: ReactionRoleDetail | null }
  | { kind: "invalid"; fields: FieldError[] }
  | { kind: "locked_button"; fields: FieldError[] }
  | { kind: "content_locked"; text: string }
  | { kind: "bot_missing_permission"; text: string }
  | { kind: "message_not_found" }
  | { kind: "target_rejected"; text: string }
  | { kind: "discord_error"; text: string }
  | { kind: "save_failed" }

function fieldList(body: Record<string, unknown>): FieldError[] {
  const fields = body.fields
  if (!Array.isArray(fields)) return []
  return fields.filter(
    (f): f is FieldError => !!f && typeof (f as FieldError).path === "string" && typeof (f as FieldError).reason === "string",
  )
}

/** 把存檔的 API 錯誤分類；不是已知的錯誤（含 wrapper 已處理的）回 null */
export function parseSaveProblem(e: unknown): SaveProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  const body = e.body ?? {}
  switch (e.code) {
    case "conflict":
      return { kind: "conflict", latest: body.deleted ? null : ((body.current as ReactionRoleDetail | null) ?? null) }
    case "invalid_request": {
      const parsed = parseFieldErrors(e)
      return parsed ? { kind: "invalid", fields: parsed } : null
    }
    case "locked_button":
      return { kind: "locked_button", fields: fieldList(body) }
    case "content_locked":
      return { kind: "content_locked", text: readBackReasonText(String(body.reason ?? "")) }
    case "bot_missing_permission":
      return { kind: "bot_missing_permission", text: fieldList(body)[0]?.reason ?? "bot 缺少發送訊息的權限" }
    case "message_not_found":
      return { kind: "message_not_found" }
    case "wrong_guild":
    case "not_bot_message":
    case "has_components":
      return { kind: "target_rejected", text: targetRejectText(e) ?? "這則訊息不能掛反應身分組。" }
    case "discord_error":
      return { kind: "discord_error", text: String(body.message ?? "") }
    case "save_failed":
      return { kind: "save_failed" }
    default:
      return null
  }
}

/** 把後端回報的欄位錯誤分到訊息欄位與各顆按鈕（buttons.N.xxx 的 N 對應目前表單的第 N 顆） */
export function splitFieldErrors(
  fields: FieldError[],
  buttons: FormButton[],
): { message: FieldError[]; buttons: ButtonErrors } {
  const message: FieldError[] = []
  const byButton: ButtonErrors = {}
  for (const f of fields) {
    const m = /^buttons\.(\d+)\./.exec(f.path)
    if (m) {
      const target = buttons[Number(m[1])]
      if (target) byButton[target.key] = f.reason
    } else if (f.path === "buttons") byButton._ = f.reason
    else message.push(f)
  }
  return { message, buttons: byButton }
}

/** 衝突提示（ConflictNotice）要顯示的值 */
export function conflictValues(
  content: MessageContent | null,
  buttons: { title: string; emoji: string | null; roleName: string | null }[],
): Record<string, string | null> {
  const parts = [content?.content?.trim(), content?.embed?.title?.trim(), content?.embed?.description?.trim()].filter(
    Boolean,
  ) as string[]
  return {
    content: content === null ? "（不可編輯）" : parts.length > 0 ? parts.join("\n") : "（空白）",
    buttons: buttons
      .map((b) => `${emojiLabel(b.emoji) ?? ""} ${b.title} → ${b.roleName ? `@${b.roleName}` : "（未選）"}`.trim())
      .join("\n"),
  }
}
