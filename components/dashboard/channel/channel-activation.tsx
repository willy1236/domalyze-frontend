"use client"

import { useEffect, useState } from "react"
import { Button, LinkButton } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  type ChannelNotice,
  type ChannelRole,
  type ChannelState,
  CHANNEL_NOTICES,
  channelAction,
  disableChannel,
  disableNotices,
  enableUrl,
  parseChannelNotices,
} from "@/lib/dashboard-channel"
import { useReloadChannel } from "./channel-access-guard"

/** 啟用流程導回頻道頁時的提示；讀完就從網址移除，重新整理時不再顯示。 */
function useChannelNotices(): ChannelNotice[] {
  const [notices, setNotices] = useState<ChannelNotice[]>([])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has("notice")) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotices(parseChannelNotices(params.get("notice")))
    params.delete("notice")
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`)
  }, [])
  return notices
}

/** 啟用、停用、重新啟用星羽的操作，以及啟用流程回來時的提示；mod 只有提示、沒有操作。要在 ChannelAccessGuard 內使用。 */
export function ChannelActivation({
  channelId,
  state,
  role = "owner",
}: {
  channelId: string
  state: ChannelState
  role?: ChannelRole
}) {
  const urlNotices = useChannelNotices()
  const [disableResult, setDisableResult] = useState<ChannelNotice[]>([])
  const notices = [...urlNotices, ...disableResult]
  const reload = useReloadChannel()
  const [origin, setOrigin] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const action = role === "owner" ? channelAction(state) : ({ kind: "none" } as const)

  // 啟用入口要帶前端的 origin；等 hydration 後才有，之前按鈕沒有連結
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin)
  }, [])

  async function disable() {
    setBusy(true)
    setFailed(false)
    setDisableResult([])
    try {
      setDisableResult(disableNotices(await disableChannel(channelId)))
      setConfirming(false)
      await reload()
    } catch (error) {
      // 已被全域處理（導向登入）的錯誤不再提示
      if (!(error instanceof DashboardApiError && error.handled)) setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 min-w-0">
      {notices.length > 0 && (
        <div role="status" className="border border-champagne/30 px-3 py-2 text-xs space-y-1">
          {notices.map((code) => (
            <p key={code}>{CHANNEL_NOTICES[code]}</p>
          ))}
        </div>
      )}
      {action.kind === "none" ? null : action.kind === "enable" ? (
        <LinkButton
          variant="outline"
          href={origin === null ? undefined : enableUrl(channelId, origin)}
        >
          {action.label}
        </LinkButton>
      ) : confirming ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            星羽會離開聊天室並停止回應，指令與設定會保留，之後可以重新啟用。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="danger" disabled={busy} onClick={() => void disable()}>
              確認停用
            </Button>
            <Button type="button" disabled={busy} onClick={() => setConfirming(false)}>
              取消
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" onClick={() => setConfirming(true)}>
          {action.label}
        </Button>
      )}
      {failed && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          停用失敗，請稍後再試。
        </p>
      )}
    </div>
  )
}
