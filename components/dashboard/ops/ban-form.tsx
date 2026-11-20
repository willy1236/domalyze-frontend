"use client"

import { useState } from "react"
import { Button, Textarea } from "@/components/ui"
import { LabelWithCount } from "@/components/dashboard/char-count"
import { DashboardApiError } from "@/lib/dashboard-api"
import { BAN_REASON_MAX, type BanResult, banChannel } from "@/lib/dashboard-ops"

/** 停權：填理由後確認。停權會讓星羽離開頻道，實況主不能自己重新啟用。 */
export function BanForm({
  channelId,
  onDone,
  onCancel,
}: {
  channelId: string
  onDone: (result: BanResult) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const used = reason.trim().length

  async function submit() {
    setBusy(true)
    setFailed(false)
    try {
      onDone(await banChannel(channelId, reason))
    } catch (error) {
      if (!(error instanceof DashboardApiError && error.handled)) setFailed(true)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 min-w-0">
      <label className="block text-xs space-y-1">
        <LabelWithCount used={used} max={BAN_REASON_MAX}>
          停權理由（只有營運看得到）
        </LabelWithCount>
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
      </label>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        星羽會離開這個頻道，實況主不能啟用，直到解除停權。
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="danger" disabled={busy || used > BAN_REASON_MAX} onClick={() => void submit()}>
          確認停權
        </Button>
        <Button type="button" disabled={busy} onClick={onCancel}>
          取消
        </Button>
      </div>
      {failed && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          停權失敗，請稍後再試。
        </p>
      )}
    </div>
  )
}
