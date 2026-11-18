// 個人區雲端資料夾共用：型別與輸入驗證（規則同後端 starlib/drive_share.py）。

import { DashboardApiError } from "./dashboard-api"

export interface DriveState {
  /** 有析域帳號，可以設定 */
  writable: boolean
  /** 查不到這個人的設定（身分服務暫時不可用） */
  unavailable: boolean
  /** 可見的 Discord 有在開放此功能的伺服器；false 時整個區塊不顯示 */
  eligible: boolean
  gmail: string | null
}

const GMAIL = /^[^@\s]+(@gmail\.com)?$/i

/** `abc` 與 `abc@gmail.com`（不分大小寫）回 `abc@gmail.com`；其他格式回 null */
export function normalizeGmail(raw: string): string | null {
  const value = raw.trim()
  if (!GMAIL.test(value)) return null
  return value.includes("@") ? value : `${value}@gmail.com`
}

/** 輸入框下方的即時提示；空白不提示（只是還沒輸入） */
export function gmailHint(raw: string): string | null {
  if (raw.trim() === "") return null
  return normalizeGmail(raw) === null ? "只能共用給 Gmail：輸入帳號，或完整的 @gmail.com 信箱" : null
}

export function failureText(e: unknown): string | null {
  if (e instanceof DashboardApiError) {
    if (e.handled) return null
    if (e.code === "invalid_gmail") return "Gmail 格式不正確。"
    if (e.code === "not_eligible") return "你目前不在開放此功能的伺服器中。"
    if (e.code === "drive_failed") return "Google 雲端共用失敗，原本的設定沒有改變，請稍後再試。"
  }
  return "操作失敗，原本的設定沒有改變，請稍後再試。"
}
