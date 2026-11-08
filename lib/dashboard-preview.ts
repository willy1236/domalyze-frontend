import { useEffect, useState } from "react"
import { dashboardFetch } from "./dashboard-api"

export interface PreviewEmbed {
  title?: string
  description?: string
  url?: string
  color?: number
  timestamp?: string
  author?: { name?: string; icon_url?: string; url?: string }
  footer?: { text?: string }
  image?: { url?: string }
  thumbnail?: { url?: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

export interface PreviewResult {
  content: string
  embeds: PreviewEmbed[]
  mention_role_id: string | null
  mention_role_name: string | null
}

/** 範例訊息的文字：身分組提及顯示成 @名稱，成員提及顯示成 @範例成員。 */
export function renderMentions(text: string, roleId: string | null, roleName: string | null): string {
  return text
    .replace(/<@&(\d+)>/g, (_m, id: string) => `@${id === roleId && roleName ? roleName : "身分組"}`)
    .replace(/<@!?\d+>/g, "@範例成員")
}

export function fetchPreview(
  guildId: string,
  notifyType: string,
  values: Record<string, string | null>,
  signal?: AbortSignal,
): Promise<PreviewResult> {
  return dashboardFetch<PreviewResult>(
    `/dashboard/guilds/${encodeURIComponent(guildId)}/preview`,
    { method: "POST", json: { notify_type: notifyType, values } },
    { signal },
  )
}

/** 表單用：值變動後稍等一下再向後端取範例；失敗時 error 為 true，保留上一次的結果。 */
export function useNotifyPreview(
  guildId: string,
  notifyType: string,
  roleId: string | null,
  message: string | null,
  delayMs = 400,
) {
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchPreview(guildId, notifyType, { role_id: roleId, message }, controller.signal)
        .then((result) => {
          setPreview(result)
          setError(false)
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true)
        })
    }, delayMs)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [guildId, notifyType, roleId, message, delayMs])

  return { preview, error }
}
