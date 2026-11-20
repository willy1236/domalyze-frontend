"use client"

import { useState } from "react"
import { DashboardApiError } from "@/lib/dashboard-api"
import type { ChannelRole } from "@/lib/dashboard-channel"
import { setModCollab } from "@/lib/dashboard-channel-settings"
import { useChannelError, useReloadChannel } from "./channel-access-guard"

/** mod 協作開關：實況主可切換，mod 只看得到目前狀態。要在 ChannelAccessGuard 內使用。 */
export function ModCollab({ channelId, enabled, role }: { channelId: string; enabled: boolean; role: ChannelRole }) {
  const reload = useReloadChannel()
  const leaveIfForbidden = useChannelError()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function toggle() {
    setBusy(true)
    setFailed(false)
    try {
      await setModCollab(channelId, !enabled)
      await reload()
    } catch (error) {
      if (leaveIfForbidden(error)) return
      // 已被全域處理（導向登入）的錯誤不再提示
      if (!(error instanceof DashboardApiError && error.handled)) setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border border-champagne/30 p-4 space-y-3 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-serif">mod 協作</h3>
        {role === "owner" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} disabled={busy} onChange={() => void toggle()} />
            開放
          </label>
        ) : (
          <span className="text-sm">{enabled ? "已開放" : "已關閉"}</span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        開放時，頻道的 mod 能進入這個後台修改指令、計時訊息與事件回應，也能在聊天室用 !add_cmd、!edit_cmd、!remove_cmd。關閉後最遲 60 秒生效。
      </p>
      {failed && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          切換失敗，請稍後再試。
        </p>
      )}
    </section>
  )
}
