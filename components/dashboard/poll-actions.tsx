"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import type { PollDetail } from "@/lib/dashboard-polls"
import {
  deletePoll,
  endPoll,
  pollActionErrorText,
  pollActionResultText,
  type PollActionKind,
  type PollActionResult,
} from "@/lib/dashboard-poll-actions"
import { sectionBasePath } from "@/lib/dashboard-sections"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"

function ConfirmDialog({
  title,
  pending,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string
  pending: PollActionKind | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (pending && !dialog.open) dialog.showModal()
    else if (!pending && dialog.open) dialog.close()
  }, [pending])

  return (
    <dialog
      ref={ref}
      aria-labelledby="poll-action-title"
      onCancel={(e) => {
        // Esc：處理中不關閉，避免看不到結果
        e.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
    >
      <h3 id="poll-action-title" className="font-serif text-lg text-primary dark:text-silver">
        {pending === "delete" ? "刪除投票" : "結算投票"}
      </h3>
      <p className={`mt-2 text-sm ${muted} break-words`}>
        {pending === "delete"
          ? `將刪除「${title}」的投票訊息與全部票數資料。這個動作無法復原。`
          : `將立即結算「${title}」並更新投票訊息，結算後不能再投票。這個動作無法復原。`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="danger" disabled={busy} onClick={onConfirm}>
          {pending === "delete" ? "確認刪除" : "確認結算"}
        </Button>
        <Button type="button" disabled={busy} onClick={onCancel}>
          取消
        </Button>
      </div>
    </dialog>
  )
}

/** 投票詳細頁的操作：發起人（或發起人離開後的管理員）可結算、刪除；兩者都要二次確認。 */
export function PollActions({
  guildId,
  detail,
  onChanged,
}: {
  guildId: string
  detail: PollDetail
  onChanged: () => Promise<void> | void
}) {
  const router = useRouter()
  const [pending, setPending] = useState<PollActionKind | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const listHref = `${sectionBasePath(guildId)}/polls`

  if (!detail.viewer.can_manage) return null

  async function run(kind: PollActionKind) {
    setBusy(true)
    setMessage(null)
    try {
      const result: PollActionResult =
        kind === "end" ? await endPoll(guildId, detail.id) : await deletePoll(guildId, detail.id)
      const text = pollActionResultText(kind, result)
      if (kind === "delete") {
        if (!result.message_failure_text) {
          router.push(listHref)
        }
        // 訊息沒刪掉時留在原地讓使用者看到原因，資料已不存在，不再重新載入
        setDeleted(true)
        setMessage({ text, error: false })
        return
      }
      setMessage({ text, error: false })
    } catch (e) {
      if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("poll action failed", e)
        setMessage({ text: pollActionErrorText(e), error: true })
      }
    } finally {
      setBusy(false)
      setPending(null)
    }
    // 成功與失敗都重新載入，畫面以資料庫目前的狀態為準
    await onChanged()
  }

  return (
    <div>
      {!deleted && (
        <div className="flex flex-wrap gap-3">
          {detail.status === "active" && (
            <Button type="button" disabled={busy} onClick={() => setPending("end")}>
              結算
            </Button>
          )}
          <Button type="button" variant="danger" disabled={busy} onClick={() => setPending("delete")}>
            刪除
          </Button>
        </div>
      )}
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={`mt-3 flex items-start gap-1.5 text-sm ${message.error ? "text-red-700 dark:text-red-300" : ""}`}
        >
          {message.error && <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />}
          <span>{message.text}</span>
        </p>
      )}
      {deleted && (
        <Link href={listHref} className="mt-3 inline-block text-sm underline">
          回到清單
        </Link>
      )}
      <ConfirmDialog
        title={detail.title}
        pending={pending}
        busy={busy}
        onConfirm={() => pending && void run(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
