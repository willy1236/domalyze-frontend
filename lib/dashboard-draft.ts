// 表單暫存：登入過期導向 Discord 授權前存下未送出的表單，回來後還原。
// 各表單用 registerDraft 註冊，頁面載入後用 consumeDraft 取回；
// layout 取得 /dashboard/me 後用 createDraftHooks 接上 fetch wrapper 的掛勾。

import { DRAFT_PREFIX, discardDrafts, type DashboardHooks } from "./dashboard-api"

export type DraftMode = "create" | "edit"

interface Registration {
  mode: DraftMode
  getState: () => unknown
}

interface StoredDraft {
  userId: string
  entryKey: string
  mode: DraftMode
  state: unknown
}

const registry = new Map<string, Registration>()
let draftUserId: string | null = null

const storageKey = (entryKey: string) => `${DRAFT_PREFIX}:${entryKey}`

/**
 * 表單打開時註冊，回傳取消註冊的函式（表單關閉時呼叫）。
 * entryKey 是哪一筆或哪個新增流程；getState 回傳還原表單需要的全部狀態，內容由各表單決定。
 */
export function registerDraft(entryKey: string, mode: DraftMode, getState: () => unknown): () => void {
  const registration: Registration = { mode, getState }
  registry.set(entryKey, registration)
  return () => {
    // 同一個 entryKey 被重新註冊後，舊的取消註冊不能把新的移掉
    if (registry.get(entryKey) === registration) registry.delete(entryKey)
  }
}

/** 取回並刪除該表單的暫存；沒有、屬於別的帳號或內容損壞時回 null。 */
export function consumeDraft<T = unknown>(entryKey: string): { mode: DraftMode; state: T } | null {
  try {
    const raw = sessionStorage.getItem(storageKey(entryKey))
    if (raw === null) return null
    sessionStorage.removeItem(storageKey(entryKey))
    const draft = JSON.parse(raw) as StoredDraft
    if (!draftUserId || draft.userId !== draftUserId) return null
    return { mode: draft.mode, state: draft.state as T }
  } catch {
    return null
  }
}

function saveRegistered(): void {
  if (!draftUserId) return
  for (const [entryKey, { mode, getState }] of registry) {
    try {
      const draft: StoredDraft = { userId: draftUserId, entryKey, mode, state: getState() }
      sessionStorage.setItem(storageKey(entryKey), JSON.stringify(draft))
    } catch {
      // 單一表單存不下（序列化失敗或 sessionStorage 不可用）不影響導向
    }
  }
}

/** 給 setDashboardHooks 的掛勾：導向登入前存下已註冊的表單；沒有權限時清掉暫存。 */
export function createDraftHooks(userId: string): DashboardHooks {
  draftUserId = userId
  return {
    beforeLoginRedirect: saveRegistered,
    onNoPermission: discardDrafts,
  }
}
