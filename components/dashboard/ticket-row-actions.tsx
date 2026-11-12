"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  runTicketAction,
  ticketActionErrorText,
  ticketRowActions,
  type TicketAction,
  type TicketItem,
} from "@/lib/dashboard-tickets"

const LABELS: Record<TicketAction, string> = { lock: "鎖定", reopen: "重開", delete: "刪除" }

/** 私人頻道列的鎖定、重開、刪除；刪除要二次確認並寫明對話無法復原。完成後重新載入清單。 */
export function TicketRowActions({
  guildId,
  ticket,
  reload,
}: {
  guildId: string
  ticket: TicketItem
  reload: () => void
}) {
  const [busy, setBusy] = useState<TicketAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()
  const name = ticket.channel.name ? `#${ticket.channel.name}` : `頻道 ${ticket.channel.id}`

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (confirming && !dialog.open) dialog.showModal()
    else if (!confirming && dialog.open) dialog.close()
  }, [confirming])

  async function run(action: TicketAction) {
    setBusy(action)
    setError(null)
    try {
      // 目標本來就是要求的狀態時後端也回成功，一樣更新清單
      await runTicketAction(guildId, ticket.channel.id, action)
      setConfirming(false)
      reload()
    } catch (err) {
      const code = err instanceof DashboardApiError ? err.code : null
      // 頻道已不在：紀錄已被後端清掉，重新載入後這一列就消失，不另外顯示錯誤（元件會跟著卸載）
      if (code === "not_found") {
        setConfirming(false)
        reload()
        return
      }
      if (!(err instanceof DashboardApiError && err.handled)) {
        console.error("ticket action failed", err)
        setError(ticketActionErrorText(code))
      }
    } finally {
      setBusy(null)
    }
  }

  const closeDialog = () => {
    setConfirming(false)
    setError(null)
  }

  return (
    <>
      {ticketRowActions(ticket.status).map((action) => (
        <Button
          key={action}
          type="button"
          size="sm"
          variant={action === "delete" ? "danger" : undefined}
          disabled={busy !== null}
          aria-label={`${LABELS[action]} ${name}`}
          onClick={() => (action === "delete" ? setConfirming(true) : run(action))}
        >
          {busy === action && action !== "delete" ? `${LABELS[action]}中…` : LABELS[action]}
        </Button>
      ))}
      {error && !confirming && (
        <span role="alert" className="basis-full text-sm text-red-700 dark:text-red-300">
          {error}
        </span>
      )}
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        onCancel={(e) => {
          e.preventDefault()
          if (!busy) closeDialog()
        }}
        onClose={closeDialog}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
      >
        <h3 id={`${uid}-title`} className="font-serif text-lg text-primary dark:text-silver break-words">
          刪除 {name}？
        </h3>
        <p className="mt-3 text-sm break-words">頻道會從 Discord 刪除，裡面的對話無法復原。</p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="danger" disabled={busy !== null} onClick={() => run("delete")}>
            {busy === "delete" ? "刪除中…" : "確認刪除"}
          </Button>
          <Button type="button" disabled={busy !== null} onClick={closeDialog}>
            取消
          </Button>
        </div>
      </dialog>
    </>
  )
}
