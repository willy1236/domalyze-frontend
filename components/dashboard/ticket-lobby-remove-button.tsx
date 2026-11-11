"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"
import {
  fetchLobbyDetail,
  parseLobbySaveProblem,
  removeLobby,
  type LobbyOriginal,
  type TicketLobby,
} from "@/lib/dashboard-tickets"

/**
 * 每個大廳的「移除」：確認視窗說明後果。移除後大廳訊息的開單按鈕拿掉，訊息與大廳頻道保留，
 * 底下的私人頻道改列「未歸屬」。開啟時載入目前的設定當作衝突比對的原值。
 */
export function TicketLobbyRemoveButton({
  guildId,
  lobby,
  onDone,
}: {
  guildId: string
  lobby: TicketLobby
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()
  const label = lobby.channel.name ? `#${lobby.channel.name}` : "此大廳"

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const fetcher = useCallback(
    async (signal: AbortSignal) => (await fetchLobbyDetail(guildId, lobby.channel.id, signal)).original,
    [guildId, lobby.channel.id],
  )
  const {
    data: original,
    setData: setOriginal,
    failed: loadFailed,
  } = useLoad<LobbyOriginal>(open ? fetcher : null, {
    onError: (e) => {
      if (e instanceof DashboardApiError && e.code === "lobby_not_found") {
        // 已被別人移除；關閉後重新載入一覽
        setOpen(false)
        onDone()
      }
    },
  })

  const close = () => {
    setOpen(false)
    setError(null)
    setChanged(false)
  }

  async function confirm() {
    if (!original) return
    setBusy(true)
    setError(null)
    try {
      await removeLobby(guildId, lobby.channel.id, original)
      close()
      onDone()
    } catch (e) {
      const problem = parseLobbySaveProblem(e)
      if (problem?.kind === "conflict") {
        if (problem.latest === null) {
          // 已被移除，目的已達成
          close()
          onDone()
        } else {
          setOriginal(problem.latest.original)
          setChanged(true)
        }
      } else if (problem?.kind === "discord_error") {
        setError(`Discord 拒絕了這次操作${problem.text ? `：${problem.text}` : ""}。大廳沒有移除。`)
      } else if (problem?.kind === "guild_unavailable") {
        setError("Discord 目前無法讀取這個伺服器，大廳沒有移除，請稍後再試。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("remove ticket lobby failed", e)
        setError("移除失敗，請稍後再試。")
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
        移除<span className="sr-only">（{label}）</span>
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
          移除這個大廳？
        </h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>成員不能再從這個大廳開單：大廳訊息的開單按鈕會拿掉，訊息與大廳頻道本身保留。</li>
          <li>底下還存在的私人頻道（目前 {lobby.ticket_count} 個）保留，改列在「未歸屬的私人頻道」。</li>
          <li>原本的管理身分組在 Discord 內失去鎖定、重開、刪除的權限，只剩有伺服器層級 Manage Channels 的人能處理。</li>
          <li>之後可以把同一個頻道重新設成大廳。</li>
        </ul>
        {loadFailed && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            無法載入這個大廳的目前設定，請關閉後重試。
          </p>
        )}
        {changed && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            這個大廳在你打開視窗後被別人修改過，已更新成最新版本。確認後請再按一次。
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="danger" disabled={busy || original === null} onClick={confirm}>
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
