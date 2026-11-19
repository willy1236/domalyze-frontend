// 頻道「設定」頁：刪除頻道在星羽的所有資料。

import { dashboardFetch } from "./dashboard-api"

export interface DeleteDataResult {
  state: "inactive"
  /** 星羽沒有完成同步（離線或內部出錯）；資料已刪、state 已是未啟用，星羽重新啟動或下次同步時依資料庫離開聊天室 */
  bot_offline: boolean
}

export function deleteChannelData(channelId: string, confirmLogin: string): Promise<DeleteDataResult> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/delete-data`, {
    method: "POST",
    json: { confirm_login: confirmLogin },
  })
}

/** 輸入的頻道名稱是否符合：忽略大小寫與前後空白，與後端的比對一致 */
export function confirmMatches(input: string, login: string): boolean {
  const typed = input.trim().toLowerCase()
  return typed !== "" && typed === login.toLowerCase()
}

export const DELETE_DONE = "已刪除這個頻道的所有資料，星羽已回到未啟用。"
// bot_offline 涵蓋星羽離線與內部出錯：兩種情況星羽都沒收到離開通知，要等它重新啟動或下次同步才會離開聊天室
export const DELETE_BOT_NOT_SYNCED = "資料已刪除，但星羽還沒收到離開通知，會在重新啟動或下次同步時離開聊天室。"

/** 刪除成功後要顯示的提示 */
export function deleteNotices(result: DeleteDataResult): string[] {
  return result.bot_offline ? [DELETE_DONE, DELETE_BOT_NOT_SYNCED] : [DELETE_DONE]
}
