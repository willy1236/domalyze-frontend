// 個人區的資料型別與顯示用的整理。

export interface PersonalPoints {
  stardust: number
  point: number
  rcoin: number
}

export interface PersonalPet {
  name: string
  species: string
  food: number | null
}

export interface PersonalDiscord {
  id: string
  name: string
  avatar_url: string
  /** 是否為目前 session 的 Discord */
  current: boolean
  points: PersonalPoints
  pet: PersonalPet | null
}

export interface PersonalOverview {
  /** 沒有析域帳號時為 null；username 為 null 表示代號暫時無法載入 */
  account: { username: string | null } | null
  /** auth server 暫時查不到連結了哪些 Discord，只有目前這個 Discord 的資料 */
  partial: boolean
  discords: PersonalDiscord[]
}

/** 欄位名稱同 /user */
export const POINT_LABELS: [keyof PersonalPoints, string][] = [
  ["stardust", "⭐星塵"],
  ["point", "PT點數"],
  ["rcoin", "Rcoin"],
]

/** 需要析域帳號的區塊（工具與公開設定）是否鎖住 */
export function isLocked(overview: PersonalOverview): boolean {
  return overview.account === null
}

/** 帳號區塊顯示的域民代號 */
export function accountLabel(account: { username: string | null }): string {
  return account.username ?? "代號暫時無法載入"
}

/** 舊網址 /dashboard?notice= 是伺服器清單的通知：回傳要轉去的伺服器清單網址（保留參數）；不需要轉址時回 null */
export function guildListRedirect(search: string): string | null {
  const params = new URLSearchParams(search)
  return params.has("notice") ? `/dashboard/guilds?${params.toString()}` : null
}
