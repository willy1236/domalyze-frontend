// 登入頁與析域登入選擇畫面共用的邏輯：登入入口網址、要回去的頁面、提示文字。

const API_BASE = process.env.NEXT_PUBLIC_BASE_API_URL ?? ""

/** 析域帳號頁：連結 Discord、管理析域帳號 */
export const DOMALYZE_ACCOUNT_URL = "https://auth.domalyze.net"

/** 析域登入逾時回到登入頁時，網址可能沒有 next，用這裡存的值接回去 */
export const LOGIN_NEXT_KEY = "dashboard:login-next"

const DEFAULT_NEXT = "/dashboard"

export type LoginProvider = "discord" | "domalyze" | "twitch"

export type LoginNotice = "domalyze_denied" | "domalyze_unavailable" | "domalyze_no_discord" | "domalyze_expired"

export const LOGIN_NOTICES: Record<LoginNotice, string> = {
  domalyze_denied: "無法以這個析域帳號登入。",
  domalyze_unavailable: "析域帳號暫時無法登入，請稍後再試，或改用 Discord 登入。",
  domalyze_no_discord: "這個析域帳號還沒有連結 Discord。請先到析域帳號頁連結 Discord，或改用 Discord 登入。",
  domalyze_expired: "登入已逾時，請重新開始。",
}

export function isLoginNotice(value: string | null): value is LoginNotice {
  return value !== null && Object.hasOwn(LOGIN_NOTICES, value)
}

/** 與後端 sanitize_next 相同：只接受 /dashboard 開頭的站內路徑，其他一律回 /dashboard */
export function sanitizeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith(DEFAULT_NEXT)) return DEFAULT_NEXT
  const rest = value.slice(DEFAULT_NEXT.length)
  if (rest && rest[0] !== "/" && rest[0] !== "?") return DEFAULT_NEXT
  if (/[\u0000-\u001f\\]/.test(value)) return DEFAULT_NEXT
  return value
}

/** 前端登入頁的網址 */
export function loginPageUrl(next: string, notice?: LoginNotice): string {
  const params = new URLSearchParams()
  if (notice) params.set("notice", notice)
  params.set("next", sanitizeNext(next))
  return `/dashboard-login?${params.toString()}`
}

const LOGIN_PATHS: Record<LoginProvider, string> = {
  discord: "/to/dashboard-login",
  domalyze: "/to/dashboard-domalyze-login",
  twitch: "/to/dashboard-twitch-login",
}

/** 後端的登入入口：Discord、析域或 Twitch */
export function providerLoginUrl(provider: LoginProvider, next: string, origin: string): string {
  const path = LOGIN_PATHS[provider]
  const params = new URLSearchParams({ next: sanitizeNext(next), origin })
  return `${API_BASE}${path}?${params.toString()}`
}

function storage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** 析域登入前記下要回去的頁面 */
export function rememberNext(next: string): void {
  try {
    storage()?.setItem(LOGIN_NEXT_KEY, sanitizeNext(next))
  } catch {
    // sessionStorage 不可用時略過，逾時後回到 /dashboard
  }
}

/** 登入完成或改選 Discord 登入時清掉 */
export function forgetNext(): void {
  try {
    storage()?.removeItem(LOGIN_NEXT_KEY)
  } catch {
    // 同上
  }
}

/** 登入頁要回去的頁面：網址的 next 優先；析域登入逾時而網址沒有 next 時，用登入前記下的值 */
export function resolveNext(search: URLSearchParams): string {
  const next = search.get("next")
  if (next) return sanitizeNext(next)
  if (search.get("notice") === "domalyze_expired") {
    try {
      return sanitizeNext(storage()?.getItem(LOGIN_NEXT_KEY))
    } catch {
      // 同上
    }
  }
  return DEFAULT_NEXT
}

/** 選擇畫面送出或載入失敗時怎麼處理：待選資料失效回登入頁、不在清單裡重新載入、其他顯示錯誤 */
export function selectErrorAction(code: string | null): "restart" | "reload" | "error" {
  if (code === "pick_expired") return "restart"
  if (code === "invalid_candidate") return "reload"
  return "error"
}
