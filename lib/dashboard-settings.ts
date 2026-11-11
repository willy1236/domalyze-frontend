import { DashboardApiError, dashboardFetch } from "./dashboard-api"

/** 排行榜上的成員，形狀同抽獎參加者；已離開的成員 `left` 為 true，名稱與頭像為 null */
export interface LeaderboardMember {
  id: string
  name: string | null
  avatar_url: string | null
  left: boolean
}

export interface LeaderboardRow {
  member: LeaderboardMember
  /** 累計總分鐘數 */
  minutes: number
}

/** 後端的自動禁言範圍與預設，與 `starlib/database/postgresql/models.py` 的 `AUTO_TIMEOUT_*` 一致 */
export const AUTO_TIMEOUT_TIMES_RANGE = [1, 20] as const
export const AUTO_TIMEOUT_SECONDS_RANGE = [60, 7 * 24 * 3600] as const

/** bot 缺少的權限；形狀同動態語音的 PermissionIssue */
export interface PermissionIssue {
  permission: string
  scope: string
  consequence: string
}

/** 可編輯的設定欄位，也是衝突比對的 original／current 形狀；每個表單只帶自己的欄位 */
export interface SettingValues {
  voice_time_counter?: boolean
  auto_timeout_enabled?: boolean
  auto_timeout_times?: number
  auto_timeout_seconds?: number
}

export interface SettingsResponse {
  voice_time_counter: boolean
  auto_timeout_enabled: boolean
  auto_timeout_times: number
  auto_timeout_seconds: number
  /** bot 缺少 Moderate Members 時有一筆 */
  permission_issues: PermissionIssue[]
  leaderboard: LeaderboardRow[]
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/settings`

export function fetchSettings(guildId: string, signal?: AbortSignal): Promise<SettingsResponse> {
  return dashboardFetch<SettingsResponse>(base(guildId), {}, { signal })
}

/** 儲存設定，回傳存檔後的完整資料（含最新排行榜）。original 是打開表單時看到的值，欄位要涵蓋 values。 */
export function saveSettings(guildId: string, values: SettingValues, original: SettingValues): Promise<SettingsResponse> {
  return dashboardFetch<SettingsResponse>(base(guildId), { method: "PUT", json: { values, original } })
}

/** 語音時數表單的欄位 */
export function voiceTimeValues(settings: SettingsResponse): SettingValues {
  return { voice_time_counter: settings.voice_time_counter }
}

/** 自動禁言表單的欄位 */
export function autoTimeoutValues(settings: SettingsResponse): Required<Pick<SettingValues, "auto_timeout_enabled" | "auto_timeout_times" | "auto_timeout_seconds">> {
  return {
    auto_timeout_enabled: settings.auto_timeout_enabled,
    auto_timeout_times: settings.auto_timeout_times,
    auto_timeout_seconds: settings.auto_timeout_seconds,
  }
}

/** 禁言時長的輸入單位，由大到小 */
export const DURATION_UNITS = [
  { key: "d", label: "天", seconds: 86400 },
  { key: "h", label: "小時", seconds: 3600 },
  { key: "m", label: "分鐘", seconds: 60 },
] as const
export type DurationUnit = (typeof DURATION_UNITS)[number]["key"]

/** 秒數拆成表單的數字與單位：取能整除的最大單位，例如 5400 → 90 分鐘、7200 → 2 小時 */
export function splitSeconds(seconds: number): { amount: number; unit: DurationUnit } {
  const unit = DURATION_UNITS.find((u) => seconds % u.seconds === 0) ?? DURATION_UNITS[2]
  return { amount: Math.floor(seconds / unit.seconds), unit: unit.key }
}

export function toSeconds(amount: number, unit: DurationUnit): number {
  return amount * (DURATION_UNITS.find((u) => u.key === unit)?.seconds ?? 60)
}

/** 自動禁言表單的輸入檢查；通過回 null，否則回應顯示的訊息與出錯的欄位 */
export function validateAutoTimeout(times: number, seconds: number): { field: "times" | "duration"; message: string } | null {
  if (!Number.isInteger(times) || times < AUTO_TIMEOUT_TIMES_RANGE[0] || times > AUTO_TIMEOUT_TIMES_RANGE[1]) {
    return { field: "times", message: `警告次數需為 ${AUTO_TIMEOUT_TIMES_RANGE[0]} 到 ${AUTO_TIMEOUT_TIMES_RANGE[1]} 的整數。` }
  }
  if (!Number.isInteger(seconds) || seconds < AUTO_TIMEOUT_SECONDS_RANGE[0] || seconds > AUTO_TIMEOUT_SECONDS_RANGE[1]) {
    return { field: "duration", message: "禁言時長需為 1 分鐘到 7 天。" }
  }
  return null
}

/** 總分鐘數顯示到小時與分鐘，例如 135 → "2 小時 15 分鐘"；不滿一小時省略小時 */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return hours === 0 ? `${rest} 分鐘` : `${hours} 小時 ${rest} 分鐘`
}

/** 後端 409 conflict 拆成表單好處理的形狀（current 只含送出時 original 有的欄位）；其他錯誤回 null。 */
export type SettingsProblem = { kind: "conflict"; current: SettingValues }

export function parseSettingsProblem(e: unknown): SettingsProblem | null {
  if (!(e instanceof DashboardApiError) || e.code !== "conflict" || !e.body) return null
  const current = e.body.current as SettingValues | null | undefined
  if (!current) return null
  return { kind: "conflict", current }
}

/** 衝突提示用：欄位值轉成字串 */
export function conflictStrings(values: SettingValues): Record<string, string | null> {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === undefined ? null : String(v)]))
}
