"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useGuildSections } from "@/components/dashboard/guild-sections"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  canRemoveRecord,
  kindLabel,
  personLabel,
  removeErrorText,
  removeWarning,
  type WarningRecord,
} from "@/lib/dashboard-warnings"

/** 每列的「移除」：二次確認後刪除紀錄，不連帶解除禁言或停權。沒有權限或不是本伺服器發出的紀錄時不顯示。 */
export function RemoveWarningButton({
  guildId,
  record,
  reload,
}: {
  guildId: string
  record: WarningRecord
  reload: () => void
}) {
  const { can } = useGuildSections()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  if (!canRemoveRecord((action) => can("warnings", action), record)) return null

  const close = () => {
    setOpen(false)
    setError(null)
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      // 紀錄已被移除時後端也回成功，這裡一樣關閉並更新清單
      await removeWarning(guildId, record.id)
      setOpen(false)
      reload()
    } catch (err) {
      if (!(err instanceof DashboardApiError && err.handled)) {
        console.error("remove warning failed", err)
        setError(removeErrorText(err instanceof DashboardApiError ? err.code : null))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button type="button" size="sm" aria-label={`移除紀錄 #${record.id}`} onClick={() => setOpen(true)}>
        移除
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        onCancel={(e) => {
          e.preventDefault()
          if (!busy) close()
        }}
        onClose={close}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
      >
        <h3 id={`${uid}-title`} className="font-serif text-lg text-primary dark:text-silver">
          移除紀錄 #{record.id}？
        </h3>
        <p className="mt-3 text-sm break-words">
          {personLabel(record.target)}的{kindLabel(record.kind)}紀錄會從系統刪除，無法復原。已執行的禁言或停權不會解除。
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="danger" disabled={busy} onClick={confirm}>
            確認移除
          </Button>
          <Button type="button" disabled={busy} onClick={close}>
            取消
          </Button>
        </div>
      </dialog>
    </>
  )
}
