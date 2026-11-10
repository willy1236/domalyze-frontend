import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export interface PermissionIssue {
  /** 例如 "Manage Channels" */
  permission: string
  scope: "category" | "guild" | "channel"
  /** 缺少時的後果（中文） */
  consequence: string
}

export interface Lobby {
  channel: {
    id: string
    /** 頻道不存在時為 null */
    name: string | null
    /** 沒有分類為 null */
    category: string | null
    /** 頻道失效的原因；正常為 null */
    invalid: string | null
  }
  /** 資料庫的原始值，衝突比對的 original 用這個 */
  template: string | null
  /** 模板失效的原因；正常為 null */
  template_invalid: string | null
  permission_issues: PermissionIssue[]
}

export interface LobbyResponse {
  lobby: Lobby | null
}

/** 房間名稱模板留空時 bot 用的名稱 */
export const DEFAULT_ROOM_NAME_HINT = "<username>的頻道"

/** Discord 頻道名稱上限，以及估算模板長度時代入 `{member}` 的 username 長度（與後端 starlib/dynamic_voice.py 一致） */
export const MAX_ROOM_NAME = 100
export const MAX_USERNAME = 32

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/dynamic-voice`

export function fetchLobby(guildId: string, signal?: AbortSignal): Promise<LobbyResponse> {
  return dashboardFetch<LobbyResponse>(base(guildId), {}, { signal })
}

/** 大廳的可編輯欄位，也是衝突比對的 original／current 形狀 */
export type LobbyValues = {
  channel_id: string
  template: string | null
}

/** 資料庫目前的值，給衝突比對當 original；template 保持原始值，不要 trim */
export function lobbyValues(lobby: Lobby): LobbyValues {
  return { channel_id: lobby.channel.id, template: lobby.template }
}

export interface LobbyChannelOption {
  id: string
  name: string
  category: string | null
  permission_issues: PermissionIssue[]
}

export interface LobbyOptions {
  channels: LobbyChannelOption[]
  /** 登入者的 Discord username；取不到為 null */
  username: string | null
}

export function fetchLobbyOptions(guildId: string, signal?: AbortSignal): Promise<LobbyOptions> {
  return dashboardFetch<LobbyOptions>(`${base(guildId)}/options`, {}, { signal })
}

/** 新增（original 為 null）或修改，回傳存檔後的一覽資料。 */
export function saveLobby(guildId: string, values: LobbyValues, original: LobbyValues | null): Promise<LobbyResponse> {
  return dashboardFetch<LobbyResponse>(base(guildId), { method: "PUT", json: { values, original } })
}

export function deleteLobby(guildId: string, original: LobbyValues): Promise<void> {
  return dashboardFetch(base(guildId), { method: "DELETE", json: { original } })
}

/** 模板去頭尾空白，空字串視為未設定（與後端 normalize_room_template 一致） */
export function normalizeTemplate(raw: string): string | null {
  const trimmed = raw.trim()
  return trimmed === "" ? null : trimmed
}

/** `{member}` 當成最長的 username 估算，房名是否超過上限；以 code point 計數，與 Python len 一致 */
export function templateTooLong(raw: string): boolean {
  const template = normalizeTemplate(raw)
  if (template === null) return false
  return [...template.replaceAll("{member}", "x".repeat(MAX_USERNAME))].length > MAX_ROOM_NAME
}

/** 預覽 bot 開房時的房名；取不到 username 時用「使用者名稱」字樣 */
export function previewRoomName(raw: string, username: string | null): string {
  const name = username ?? "使用者名稱"
  const template = normalizeTemplate(raw)
  return template === null ? `${name}的頻道` : template.replaceAll("{member}", name)
}

/** 後端 409 / 400 的回應拆成表單好處理的形狀；其他錯誤回 null。 */
export type LobbyProblem =
  | { kind: "conflict"; deleted: boolean; current: LobbyValues | null }
  | { kind: "already_exists"; current: LobbyValues }
  | { kind: "invalid_field"; field: string }

function toValues(raw: Record<string, string | null>): LobbyValues {
  return { channel_id: raw.channel_id ?? "", template: raw.template ?? null }
}

export function parseLobbyProblem(e: unknown): LobbyProblem | null {
  if (!(e instanceof DashboardApiError) || !e.body) return null
  const body = e.body as { deleted?: boolean; current?: Record<string, string | null> | null; field?: string }
  if (e.code === "conflict") {
    return { kind: "conflict", deleted: body.deleted === true, current: body.current ? toValues(body.current) : null }
  }
  if (e.code === "already_exists" && body.current) return { kind: "already_exists", current: toValues(body.current) }
  if (e.code === "invalid_request" && body.field) return { kind: "invalid_field", field: body.field }
  return null
}
