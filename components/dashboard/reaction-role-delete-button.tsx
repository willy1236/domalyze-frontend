"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"
import {
  deleteReactionRole,
  fetchReactionRoleDetail,
  originalOf,
  parseSaveProblem,
  type DeleteMode,
  type ReactionRoleMessage,
} from "@/lib/dashboard-reaction-roles"

const MODES: { value: DeleteMode; label: string; hint: string }[] = [
  { value: "delete_message", label: "刪除訊息", hint: "Discord 上的訊息會被刪除，按鈕一起消失。" },
  { value: "remove_buttons", label: "只拿掉按鈕、保留訊息", hint: "訊息留在頻道裡，下方的按鈕會移除。" },
]

/**
 * 每則的「刪除」：確認視窗讓管理員選刪除訊息或只拿掉按鈕（預設刪除訊息），兩種都移除 bot 的紀錄。
 * 訊息或頻道已失效時改成「移除紀錄」，Discord 上已沒有東西可動，只移除紀錄。
 */
export function ReactionRoleDeleteButton({
  guildId,
  message,
  onDone,
}: {
  guildId: string
  message: ReactionRoleMessage
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DeleteMode>("delete_message")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()
  const recordOnly = message.invalid || message.channel.invalid
  const channelLabel = message.channel.name ? `#${message.channel.name}` : "此訊息"

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // 開啟時載入目前的內容與按鈕，當作衝突比對的原值
  const fetcher = useCallback(
    async (signal: AbortSignal) => originalOf(await fetchReactionRoleDetail(guildId, message.message_id, signal)),
    [guildId, message.message_id],
  )
  const {
    data: original,
    setData: setOriginal,
    failed: loadFailed,
  } = useLoad(open ? fetcher : null, {
    onError: (e) => {
      if (e instanceof DashboardApiError && e.code === "not_found") {
        // 紀錄已被別人移除；關閉後 fetcher 變成 null，不會顯示載入失敗
        setOpen(false)
        onDone()
      }
    },
  })

  const close = () => {
    setOpen(false)
    setError(null)
    setChanged(false)
    setMode("delete_message")
  }

  async function confirm() {
    if (!original) return
    setBusy(true)
    setError(null)
    try {
      await deleteReactionRole(guildId, message.message_id, { mode: recordOnly ? "delete_message" : mode, original })
      close()
      onDone()
    } catch (e) {
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict") {
        if (problem.latest === null) {
          // 已被刪除，目的已達成
          close()
          onDone()
        } else {
          setOriginal(originalOf(problem.latest))
          setChanged(true)
        }
      } else if (problem?.kind === "discord_error") {
        setError(`Discord 拒絕了這次操作${problem.text ? `：${problem.text}` : ""}。紀錄沒有移除。`)
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete reaction role failed", e)
        setError("刪除失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
        onClick={() => setOpen(true)}
      >
        {recordOnly ? "移除紀錄" : "刪除"}
        <span className="sr-only">（{channelLabel}）</span>
      </button>
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
          {recordOnly ? "移除這則的紀錄？" : "刪除這則反應身分組？"}
        </h3>
        {recordOnly ? (
          <p className="mt-3 text-sm break-words">
            這則訊息在 Discord 上已不存在，只會移除星羽的紀錄，無法復原。若想補回，請改用「重新發送」。
          </p>
        ) : (
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">刪除方式</legend>
            {MODES.map((m) => (
              <label key={m.value} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={`${uid}-mode`}
                  value={m.value}
                  checked={mode === m.value}
                  disabled={busy}
                  onChange={() => setMode(m.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">{m.label}</span>
                  <span className="block text-gray-600 dark:text-gray-400">{m.hint}</span>
                </span>
              </label>
            ))}
            <p className="text-sm text-gray-600 dark:text-gray-400">兩種做法都會移除星羽的紀錄，無法復原。</p>
          </fieldset>
        )}
        {loadFailed && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            無法載入這則的目前內容，請關閉後重試。
          </p>
        )}
        {changed && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            這則在你打開視窗後被別人修改過，已更新成最新版本。確認後請再按一次。
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="danger" disabled={busy || original === null} onClick={confirm}>
            {recordOnly ? "確認移除" : "確認刪除"}
          </Button>
          <Button type="button" disabled={busy} onClick={close}>
            取消
          </Button>
        </div>
      </dialog>
    </>
  )
}
