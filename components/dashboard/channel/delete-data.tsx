"use client"

import { useState } from "react"
import { Button, Input } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { confirmMatches, deleteChannelData, deleteNotices } from "@/lib/dashboard-channel-settings"
import { useChannelError, useReloadChannel } from "./channel-access-guard"

/** 危險區塊：輸入頻道名稱後刪除頻道在星羽的所有資料。要在 ChannelAccessGuard 內使用。 */
export function DeleteData({ channelId, login }: { channelId: string; login: string }) {
  const reload = useReloadChannel()
  const leaveIfUnlinked = useChannelError()
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [notices, setNotices] = useState<string[]>([])
  const matches = confirmMatches(input, login)

  async function remove() {
    setBusy(true)
    setFailed(false)
    setNotices([])
    try {
      const result = await deleteChannelData(channelId, input)
      setNotices(deleteNotices(result))
      setInput("")
      await reload()
    } catch (error) {
      if (leaveIfUnlinked(error)) return
      // 已被全域處理（導向登入）的錯誤不再提示
      if (!(error instanceof DashboardApiError && error.handled)) setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border border-red-600/40 dark:border-red-400/40 p-4 space-y-3 min-w-0">
      <h3 className="text-lg font-serif text-red-600 dark:text-red-400">刪除所有資料</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>星羽會離開聊天室並停止回應，並永久刪除這個頻道的：</p>
        <ul className="list-disc pl-5">
          <li>自訂指令、計時訊息、事件回應</li>
          <li>轉發 Discord 的設定</li>
          <li>授權給星羽的 Twitch 授權</li>
        </ul>
        <p>修改紀錄會保留。刪除後無法復原，再次啟用時從空白開始。</p>
      </div>
      {notices.length > 0 && (
        <div role="status" className="border border-champagne/30 px-3 py-2 text-xs space-y-1">
          {notices.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      )}
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (matches && !busy) void remove()
        }}
      >
        <label className="block text-sm">
          輸入頻道名稱 <span className="font-mono">{login}</span> 以確認
          <Input className="mt-1" value={input} onChange={(event) => setInput(event.target.value)} autoComplete="off" />
        </label>
        <Button type="submit" variant="danger" disabled={!matches || busy}>
          刪除所有資料
        </Button>
      </form>
      {failed && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          刪除失敗，請稍後再試。
        </p>
      )}
    </section>
  )
}
