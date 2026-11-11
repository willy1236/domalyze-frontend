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

/** 可編輯的設定欄位，也是衝突比對的 original／current 形狀；B-02 會在這裡加上自動禁言欄位 */
export interface SettingValues {
  voice_time_counter: boolean
}

export interface SettingsResponse extends SettingValues {
  leaderboard: LeaderboardRow[]
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/settings`

export function fetchSettings(guildId: string, signal?: AbortSignal): Promise<SettingsResponse> {
  return dashboardFetch<SettingsResponse>(base(guildId), {}, { signal })
}

/** 儲存設定，回傳存檔後的完整資料（含最新排行榜）。original 是打開表單時看到的值。 */
export function saveSettings(guildId: string, values: SettingValues, original: SettingValues): Promise<SettingsResponse> {
  return dashboardFetch<SettingsResponse>(base(guildId), { method: "PUT", json: { values, original } })
}

/** 資料庫目前的設定值，給衝突比對當 original */
export function settingValues(settings: SettingValues): SettingValues {
  return { voice_time_counter: settings.voice_time_counter }
}

/** 總分鐘數顯示到小時與分鐘，例如 135 → "2 小時 15 分鐘"；不滿一小時省略小時 */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return hours === 0 ? `${rest} 分鐘` : `${hours} 小時 ${rest} 分鐘`
}

/** 後端 409 conflict 拆成表單好處理的形狀；其他錯誤回 null。 */
export type SettingsProblem = { kind: "conflict"; current: SettingValues }

export function parseSettingsProblem(e: unknown): SettingsProblem | null {
  if (!(e instanceof DashboardApiError) || e.code !== "conflict" || !e.body) return null
  const current = e.body.current as Partial<SettingValues> | null | undefined
  if (!current) return null
  return { kind: "conflict", current: { voice_time_counter: current.voice_time_counter === true } }
}
