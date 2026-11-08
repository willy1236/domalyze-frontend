import { useEffect, useState } from "react"
import { dashboardFetch } from "./dashboard-api"

export interface ChannelOption {
  id: string
  name: string
  type: string
}

export interface RoleOption {
  id: string
  name: string
  /** 例如 "#ff0000"；沒設顏色為 null */
  color: string | null
}

export interface NotifyOptions {
  channels: ChannelOption[]
  roles: RoleOption[]
}

/** 取得該種類可選的頻道與身分組；notifyType 是 T-03 的種類鍵，例如 "channel:4"。 */
export function fetchNotifyOptions(guildId: string, notifyType: string, signal?: AbortSignal): Promise<NotifyOptions> {
  const query = new URLSearchParams({ notify_type: notifyType })
  return dashboardFetch<NotifyOptions>(`/dashboard/guilds/${encodeURIComponent(guildId)}/options?${query}`, {}, { signal })
}

/** 表單用：載入選項，失敗時 error 為 true。 */
export function useNotifyOptions(guildId: string, notifyType: string) {
  const [options, setOptions] = useState<NotifyOptions | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setOptions(null)
    setError(false)
    fetchNotifyOptions(guildId, notifyType, controller.signal)
      .then(setOptions)
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
    return () => controller.abort()
  }, [guildId, notifyType])

  return { options, error }
}
