// 頻道後台的自訂指令：資料型別、寫入 API，以及表單與衝突提示用的轉換。對應後端 channel_commands.py。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export const NAME_MAX = 25
export const RESPONSE_MAX = 500
export const COOLDOWN_MAX = 3600
export const ALIASES_MAX = 10

export type CommandPermission = "everyone" | "subscriber" | "vip" | "mod" | "broadcaster"

/** 由低到高；觸發者的層級要大於等於指令的權限 */
export const PERMISSIONS: { value: CommandPermission; label: string }[] = [
  { value: "everyone", label: "所有人" },
  { value: "subscriber", label: "訂閱者" },
  { value: "vip", label: "VIP" },
  { value: "mod", label: "mod" },
  { value: "broadcaster", label: "實況主" },
]

export function permissionLabel(value: string): string {
  return PERMISSIONS.find((p) => p.value === value)?.label ?? value
}

/** 回應內容可用的變數；不認得的變數會原樣送出 */
export const COMMAND_VARIABLES: { token: string; description: string }[] = [
  { token: "{user}", description: "觸發的人" },
  { token: "{touser}", description: "指令後第一個字（去掉 @），沒有就是觸發的人" },
  { token: "{args}", description: "指令後面的全部文字" },
  { token: "{count}", description: "這個指令被使用的次數" },
  { token: "{channel}", description: "頻道名稱" },
  { token: "{uptime}", description: "已開台時間，沒開台是「未開台」" },
  { token: "{game}", description: "目前分類" },
  { token: "{title}", description: "目前標題" },
]

/** 表單可編輯的欄位，也是 PUT／DELETE 的 original */
export interface CommandValues {
  name: string
  response: string
  aliases: string[]
  enabled: boolean
  global_cooldown: number
  user_cooldown: number
  permission: CommandPermission
}

export interface ChannelCommand extends CommandValues {
  use_count: number
  updated_at: string
}

export const EMPTY_COMMAND: CommandValues = {
  name: "",
  response: "",
  aliases: [],
  enabled: true,
  global_cooldown: 30,
  user_cooldown: 0,
  permission: "everyone",
}

/** 只取可編輯的欄位，使用次數與更新時間不放進 original，聊天室觸發指令才不會造成假衝突 */
export function valuesOf(command: ChannelCommand | CommandValues): CommandValues {
  return {
    name: command.name,
    response: command.response,
    aliases: [...command.aliases],
    enabled: command.enabled,
    global_cooldown: command.global_cooldown,
    user_cooldown: command.user_cooldown,
    permission: command.permission,
  }
}

const base = (channelId: string) => `/dashboard/channels/${encodeURIComponent(channelId)}/commands`

export function fetchCommands(channelId: string, signal?: AbortSignal): Promise<{ commands: ChannelCommand[] }> {
  return dashboardFetch(base(channelId), {}, { signal })
}

export function createCommand(channelId: string, values: CommandValues): Promise<{ command: ChannelCommand }> {
  return dashboardFetch(base(channelId), { method: "POST", json: values })
}

export function saveCommand(
  channelId: string,
  name: string,
  values: CommandValues,
  original: CommandValues,
): Promise<{ command: ChannelCommand }> {
  return dashboardFetch(`${base(channelId)}/${encodeURIComponent(name)}`, { method: "PUT", json: { values, original } })
}

export function deleteCommand(channelId: string, name: string, original: CommandValues): Promise<void> {
  return dashboardFetch(`${base(channelId)}/${encodeURIComponent(name)}`, { method: "DELETE", json: { original } })
}

/** 衝突提示用的字串形式，和後端 twitch_commands.comparable 一致 */
export type ConflictValues = Record<string, string | null>

export function toConflictValues(values: CommandValues): ConflictValues {
  return {
    name: values.name,
    response: values.response,
    aliases: [...values.aliases].sort().join("\n"),
    enabled: values.enabled ? "true" : "false",
    global_cooldown: String(values.global_cooldown),
    user_cooldown: String(values.user_cooldown),
    permission: values.permission,
  }
}

/** 409 回傳的最新值轉回表單的值，「以我的內容覆蓋」時當新的原始值 */
export function fromConflictValues(current: ConflictValues): CommandValues {
  const aliases = current.aliases ?? ""
  return {
    name: current.name ?? "",
    response: current.response ?? "",
    aliases: aliases === "" ? [] : aliases.split("\n"),
    enabled: current.enabled === "true",
    global_cooldown: Number(current.global_cooldown ?? 30),
    user_cooldown: Number(current.user_cooldown ?? 0),
    permission: (current.permission ?? "everyone") as CommandPermission,
  }
}

/** 衝突提示裡欄位值的顯示文字 */
export function formatConflictField(field: string, value: string | null): string {
  if (value === null || value === "") return "無"
  switch (field) {
    case "enabled":
      return value === "true" ? "開啟" : "關閉"
    case "global_cooldown":
    case "user_cooldown":
      return `${value} 秒`
    case "permission":
      return permissionLabel(value)
    case "aliases":
      return value
        .split("\n")
        .map((a) => `!${a}`)
        .join("、")
    case "name":
      return `!${value}`
    default:
      return value
  }
}

/** 別名輸入框的文字（空白、逗號分隔）轉成別名清單：去掉開頭的 !、轉小寫、去掉重複與空字串 */
export function parseAliasInput(text: string): string[] {
  const seen = new Set<string>()
  for (const part of text.split(/[\s,，、]+/)) {
    const alias = part.trim().replace(/^!+/, "").toLowerCase()
    if (alias) seen.add(alias)
  }
  return [...seen]
}

export function aliasesToInput(aliases: string[]): string {
  return aliases.map((a) => `!${a}`).join(" ")
}

/** 名稱欄的正規化，和後端一致：去掉頭尾空白與開頭的 !、轉小寫 */
export function normalizeName(text: string): string {
  return text.trim().replace(/^!/, "").toLowerCase()
}

/** 後端 409 / 400 / 422 / 503 的回應拆成表單好處理的形狀；其他錯誤回 null。 */
export type SaveProblem =
  | { kind: "conflict"; deleted: boolean; current: ConflictValues | null }
  | { kind: "invalid_field"; field: string; reason: string }
  | { kind: "automod_blocked" }
  | { kind: "automod_unavailable" }
  | { kind: "not_enabled" }

export function parseSaveProblem(e: unknown): SaveProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  const body = (e.body ?? {}) as { deleted?: boolean; current?: ConflictValues | null; field?: string; reason?: string }
  switch (e.code) {
    case "conflict":
      return { kind: "conflict", deleted: body.deleted === true, current: body.current ?? null }
    case "invalid_field":
      return body.field && body.reason ? { kind: "invalid_field", field: body.field, reason: body.reason } : null
    case "automod_blocked":
      return { kind: "automod_blocked" }
    case "automod_unavailable":
      return { kind: "automod_unavailable" }
    case "channel_not_enabled":
      return { kind: "not_enabled" }
    default:
      return null
  }
}

/** 清單每列的一行摘要：別名、權限、冷卻 */
export function commandSummary(command: CommandValues): string {
  const parts: string[] = []
  if (command.aliases.length > 0) parts.push(`別名 ${aliasesToInput(command.aliases)}`)
  parts.push(`權限：${permissionLabel(command.permission)}`)
  parts.push(`全體冷卻 ${command.global_cooldown} 秒`)
  if (command.user_cooldown > 0) parts.push(`個人冷卻 ${command.user_cooldown} 秒`)
  return parts.join(" · ")
}
