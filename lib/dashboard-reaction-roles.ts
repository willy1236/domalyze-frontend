import { dashboardFetch } from "./dashboard-api"

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
