"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  actionErrorText,
  actionResultText,
  endGiveaway,
  participantLabel,
  redrawGiveaway,
  type GiveawayActionResult,
  type GiveawayDetail,
} from "@/lib/dashboard-giveaways"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"

type Pending = "end" | "redraw" | null

function ConfirmDialog({
  detail,
  pending,
  busy,
  onConfirm,
  onCancel,
}: {
  detail: GiveawayDetail
  pending: Pending
  busy: boolean
  onConfirm: (winnerUserId?: string) => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  // "" 代表全部重抽
  const [target, setTarget] = useState("")
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (pending && !dialog.open) dialog.showModal()
    else if (!pending && dialog.open) dialog.close()
    if (!pending) setTarget("")
  }, [pending])

  return (
    <dialog
      ref={ref}
      aria-labelledby="giveaway-action-title"
      onCancel={(e) => {
        // Esc：處理中不關閉，避免看不到結果
        e.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
    >
      <h3 id="giveaway-action-title" className="font-serif text-lg text-primary dark:text-silver">
        {pending === "end" ? "提前結束抽獎" : "重抽"}
      </h3>
      {pending === "end" ? (
        <p className={`mt-2 text-sm ${muted}`}>
          將立即為「{detail.prize_name}」開獎，更新抽獎訊息並在原頻道公告中獎者。這個動作無法復原。
        </p>
      ) : (
        <div className="mt-2 space-y-3 text-sm">
          <p className={muted}>
            重抽後會更新抽獎訊息上的結果並在原頻道公告，重抽次數加一。
          </p>
          <fieldset className="space-y-2">
            <legend className="sr-only">重抽方式</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="redraw-target" checked={target === ""} onChange={() => setTarget("")} className="mt-1" />
              <span>全部重抽（不保留原本的中獎者）</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="redraw-target"
                checked={target !== ""}
                disabled={detail.winners.length === 0}
                onChange={() => setTarget(detail.winners[0]?.id ?? "")}
                className="mt-1"
              />
              <span>只替換一位中獎者（取消他的資格並抽出替補）</span>
            </label>
            {target !== "" && (
              <select
                aria-label="要替換的中獎者"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-md border border-primary/20 dark:border-champagne/25 bg-transparent px-2 py-1.5"
              >
                {detail.winners.map((w) => (
                  <option key={w.id} value={w.id}>
                    {participantLabel(w)}
                  </option>
                ))}
              </select>
            )}
          </fieldset>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="danger" disabled={busy} onClick={() => onConfirm(target || undefined)}>
          {pending === "end" ? "確認結束" : "確認重抽"}
        </Button>
        <Button type="button" disabled={busy} onClick={onCancel}>
          取消
        </Button>
      </div>
    </dialog>
  )
}

/** 抽獎詳情的操作：進行中可以提前結束，已結束可以重抽；兩者都要二次確認，完成後重新載入詳情。 */
export function GiveawayActions({
  guildId,
  detail,
  reload,
}: {
  guildId: string
  detail: GiveawayDetail
  reload: () => Promise<void>
}) {
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const active = detail.status === "active"

  async function run(kind: "end" | "redraw", winnerUserId?: string) {
    setBusy(true)
    setMessage(null)
    try {
      const result: GiveawayActionResult =
        kind === "end" ? await endGiveaway(guildId, detail.id) : await redrawGiveaway(guildId, detail.id, winnerUserId)
      setMessage({ text: actionResultText(kind, result), error: false })
    } catch (e) {
      if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("giveaway action failed", e)
        setMessage({ text: actionErrorText(e instanceof DashboardApiError ? e.code : null), error: true })
      }
    } finally {
      setBusy(false)
      setPending(null)
    }
    // 不論成功或失敗都重新載入，畫面以資料庫目前的狀態為準
    await reload()
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {active ? (
          <Button type="button" variant="danger" disabled={busy} onClick={() => setPending("end")}>
            提前結束
          </Button>
        ) : (
          <Button type="button" disabled={busy} onClick={() => setPending("redraw")}>
            重抽
          </Button>
        )}
      </div>
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={`mt-3 flex items-start gap-1.5 text-sm ${message.error ? "text-red-700 dark:text-red-300" : ""}`}
        >
          {message.error && <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />}
          <span>{message.text}</span>
        </p>
      )}
      <ConfirmDialog
        detail={detail}
        pending={pending}
        busy={busy}
        onConfirm={(winner) => void run(pending as "end" | "redraw", winner)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
