// GET /dashboard/guilds/{id}/notifies 的回應型別。Discord ID 一律是字串。

export interface ChannelRef {
  id: string
  /** 頻道已不存在時為 null */
  name: string | null
  /** 失效原因；有效時為 null */
  invalid: string | null
}

export interface RoleRef {
  id: string
  name: string | null
  invalid: string | null
}

export interface NotifyItem {
  /** 字串種類鍵，例如 channel:4、community:1 */
  key: string
  name: string
  channel: ChannelRef
  /** 只有該種類用得到身分組時才有此欄位；沒設定為 null */
  role?: RoleRef | null
  /** 只有該種類用得到自訂文字時才有此欄位 */
  message?: string | null
  /** 該筆目前的值，T-04 的衝突比對原始值 */
  values: Record<string, string | null>
  /** 是否提供測試通知；定時通知為 false */
  testable?: boolean
  /** 測試通知的剩餘冷卻秒數 */
  cooldown?: number
  /** 社群推播的對象帳號 */
  account?: { id: string; display_name: string; username: string }
}

export interface NotifyLists {
  channel_notifies: NotifyItem[]
  community_notifies: NotifyItem[]
}
