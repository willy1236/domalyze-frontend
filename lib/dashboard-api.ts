// 後台所有 API 呼叫的共用 fetch wrapper。
// 依回應的 `error` 碼分派，不依 HTTP 狀態碼；其他錯誤碼交給呼叫端處理。

export const API_BASE = process.env.NEXT_PUBLIC_BASE_API_URL ?? ""

/** 換帳號偵測用：導向登入前存下目前的 Discord user ID */
export const LAST_USER_KEY = "dashboard:last-user-id"

/** T-04 的暫存介面與換帳號偵測共用的 sessionStorage 前綴 */
export const DRAFT_PREFIX = "dashboard:draft"

/** 丟棄所有表單暫存（換帳號、登出時用） */
export function discardDrafts(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(DRAFT_PREFIX)) keys.push(k)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // sessionStorage 不可用時略過
  }
}

export interface DashboardHooks {
  beforeLoginRedirect?: () => void
  onNoPermission?: () => void
}

export interface DashboardFetchOptions {
  timeoutMs?: number
  signal?: AbortSignal
  /** 收到 session_expired 時不顯示提示、直接導向登入（layout 載入時用） */
  silentSessionExpired?: boolean
  /** 收到 session_expired 視同成功（登出用）：不提示、不導向，回傳 undefined */
  sessionExpiredIsOk?: boolean
}

export class DashboardApiError extends Error {
  readonly status: number
  /** 回應 JSON 的 `error` 欄位；沒有就是 null */
  readonly code: string | null
  readonly body: Record<string, unknown> | null
  /** wrapper 是否已處理（提示或導向），呼叫端不必再顯示 */
  readonly handled: boolean

  constructor(
    status: number,
    code: string | null,
    body: Record<string, unknown> | null,
    handled: boolean,
  ) {
    super(code ?? `HTTP ${status}`)
    this.name = "DashboardApiError"
    this.status = status
    this.code = code
    this.body = body
    this.handled = handled
  }
}

let hooks: DashboardHooks = {}
let currentUserId: string | null = null

export function setDashboardHooks(next: DashboardHooks): void {
  hooks = { ...next }
}

/** 目前登入的 Discord user ID；尚未取得為 null */
export function getDashboardUserId(): string | null {
  return currentUserId
}

/** layout 取得 /dashboard/me 後呼叫，讓導向登入前能記下目前帳號 */
export function setDashboardUserId(id: string | null): void {
  currentUserId = id
}

export function dashboardLoginUrl(next: string): string {
  const params = new URLSearchParams({ next, origin: window.location.origin })
  return `${API_BASE}/to/dashboard-login?${params.toString()}`
}

/** 整頁導向登入。回傳永不 resolve 的 Promise，避免呼叫端在導向期間繼續執行。 */
export function redirectToLogin(): Promise<never> {
  try {
    hooks.beforeLoginRedirect?.()
  } catch (e) {
    console.error("beforeLoginRedirect failed", e)
  }
  try {
    if (currentUserId) sessionStorage.setItem(LAST_USER_KEY, currentUserId)
  } catch {
    // sessionStorage 不可用時略過，只是少了換帳號偵測
  }
  const next = window.location.pathname + window.location.search
  window.location.href = dashboardLoginUrl(next)
  return new Promise<never>(() => {})
}

function redirectToDashboard(): Promise<never> {
  window.location.href = "/dashboard"
  return new Promise<never>(() => {})
}

function mergeSignals(
  signal: AbortSignal | undefined,
  timeoutMs: number | undefined,
): { signal: AbortSignal | undefined; cleanup: () => void } {
  if (timeoutMs === undefined) return { signal, cleanup: () => {} }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener("abort", onAbort, { once: true })
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer)
      signal?.removeEventListener("abort", onAbort)
    },
  }
}

export async function dashboardFetch<T = unknown>(
  path: string,
  init: Omit<RequestInit, "signal" | "credentials" | "body"> & { json?: unknown } = {},
  options: DashboardFetchOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const finalHeaders = new Headers(headers)
  let body: string | undefined
  if (json !== undefined) {
    body = JSON.stringify(json)
    finalHeaders.set("Content-Type", "application/json")
  }

  const { signal, cleanup } = mergeSignals(options.signal, options.timeoutMs)
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      body,
      credentials: "include",
      signal,
    })
  } finally {
    cleanup()
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  let data: Record<string, unknown> | null = null
  try {
    const parsed: unknown = await res.json()
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>
  } catch {
    // 非 JSON 回應（例如路由不存在）
  }
  const code = typeof data?.error === "string" ? data.error : null

  switch (code) {
    case "session_expired":
    case "reauth_required":
      if (code === "session_expired" && options.sessionExpiredIsOk) return undefined as T
      if (!(code === "session_expired" && options.silentSessionExpired)) {
        window.alert(
          code === "session_expired"
            ? "登入已過期，請重新登入。"
            : "Discord 授權已失效，請重新授權。",
        )
      }
      return redirectToLogin()
    case "no_permission":
      try {
        hooks.onNoPermission?.()
      } catch (e) {
        console.error("onNoPermission failed", e)
      }
      window.alert("你沒有這個伺服器的管理權限。")
      return redirectToDashboard()
    case "bot_not_in_guild":
      window.alert("星羽已不在這個伺服器。")
      return redirectToDashboard()
    case "bot_unavailable":
    case "discord_unavailable":
      window.alert("服務暫時無法使用，請稍後再試。")
      throw new DashboardApiError(res.status, code, data, true)
    default:
      // 其他錯誤碼，或沒有 error 欄位：交給呼叫端當一般錯誤處理，不導向
      throw new DashboardApiError(res.status, code, data, false)
  }
}
