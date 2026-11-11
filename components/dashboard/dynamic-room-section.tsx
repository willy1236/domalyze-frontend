"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  clearRooms,
  fetchRooms,
  formatCreatedAt,
  isEmptyRoom,
  type ClearResult,
  type DynamicRoom,
} from "@/lib/dashboard-dynamic-voice-rooms"
import { useLoad } from "@/lib/use-load"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function Creator({ creator }: { creator: DynamicRoom["creator"] }) {
  if (!creator) return <span className={muted}>已離開的成員</span>
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={creator.avatar_url} alt="" width={20} height={20} className="w-5 h-5 rounded-full shrink-0" />
      <span className="break-all">{creator.name}</span>
    </span>
  )
}

function RoomRow({ room, onClear }: { room: DynamicRoom; onClear: (room: DynamicRoom) => void }) {
  return (
    <li className="py-4 flex items-start gap-4">
      <div className="min-w-0 flex-1 grid gap-x-8 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_5rem_7rem] sm:items-center">
        <h3 className="font-serif text-lg leading-snug text-primary dark:text-silver break-words">{room.name}</h3>
        <p className="text-sm">
          <span className={`sm:hidden ${muted}`}>建立者：</span>
          <Creator creator={room.creator} />
        </p>
        <p className="text-sm tabular-nums">
          <span className={`sm:hidden ${muted}`}>人數：</span>
          {room.member_count} 人
        </p>
        <p className="text-sm tabular-nums">
          <span className={`sm:hidden ${muted}`}>建立時間：</span>
          {formatCreatedAt(room.created_at)}
        </p>
      </div>
      {/* 固定寬度保留按鈕位置，有人的房間沒有按鈕時欄位也不會位移 */}
      <div className="w-16 shrink-0 flex justify-end">
        {isEmptyRoom(room) && (
          <Button type="button" size="sm" variant="danger" onClick={() => onClear(room)}>
            清除
          </Button>
        )}
      </div>
    </li>
  )
}

/** 清除前的確認視窗，列出要清除的房間名稱 */
function ConfirmDialog({
  rooms,
  busy,
  onConfirm,
  onCancel,
}: {
  rooms: DynamicRoom[] | null
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (rooms && !dialog.open) dialog.showModal()
    else if (!rooms && dialog.open) dialog.close()
  }, [rooms])

  return (
    <dialog
      ref={ref}
      aria-labelledby="clear-rooms-title"
      onCancel={(e) => {
        // Esc：清除進行中不關閉，避免看不到結果
        e.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
    >
      <h3 id="clear-rooms-title" className="font-serif text-lg text-primary dark:text-silver">
        清除空房
      </h3>
      <p className={`mt-2 text-sm ${muted}`}>以下 {rooms?.length ?? 0} 間房間沒有人，確認後會刪除這些語音頻道：</p>
      <ul className="mt-3 max-h-60 overflow-y-auto space-y-1 text-sm">
        {rooms?.map((room) => (
          <li key={room.id} className="break-words">
            {room.name}
          </li>
        ))}
      </ul>
      <p className={`mt-3 text-sm ${muted}`}>執行時會再確認一次，這段期間有人進入的房間會被跳過。</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="danger" disabled={busy} onClick={onConfirm}>
          確認清除
        </Button>
        <Button type="button" disabled={busy} onClick={onCancel}>
          取消
        </Button>
      </div>
    </dialog>
  )
}

/** 清除結果：被跳過與失敗的逐筆列出 */
function ClearReport({ results, onDismiss }: { results: ClearResult[]; onDismiss: () => void }) {
  const cleared = results.filter((r) => r.status === "cleared").length
  const skipped = results.filter((r) => r.status === "skipped_occupied")
  const failed = results.filter((r) => r.status === "failed")
  return (
    <div role="status" className="mt-4 rounded-md border border-primary/20 dark:border-champagne/25 p-4 text-sm space-y-2">
      <p>已清除 {cleared} 間房間。</p>
      {skipped.map((r) => (
        <p key={r.id} className="flex items-start gap-1.5">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span className="break-words">{r.name ?? r.id}：有人進入，已跳過</span>
        </p>
      ))}
      {failed.map((r) => (
        <p key={r.id} className="flex items-start gap-1.5 text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span className="break-words">
            {r.name ?? r.id}：{r.reason ?? "清除失敗"}
          </span>
        </p>
      ))}
      <Button type="button" size="sm" onClick={onDismiss}>
        關閉
      </Button>
    </div>
  )
}

/** 動態房間清單：進入頁面時載入，另有手動重新整理，不做即時更新；空房可逐筆或一次清除。 */
export function DynamicRoomSection({ guildId }: { guildId: string }) {
  const fetcher = useCallback(async (signal: AbortSignal) => (await fetchRooms(guildId, signal)).rooms, [guildId])
  const { data: rooms, failed, loading, reload: load } = useLoad(fetcher)
  const [confirming, setConfirming] = useState<DynamicRoom[] | null>(null)
  const [clearing, setClearing] = useState(false)
  const [report, setReport] = useState<ClearResult[] | null>(null)
  const [clearError, setClearError] = useState<string | null>(null)


  const emptyRooms = rooms?.filter(isEmptyRoom) ?? []

  async function confirmClear() {
    if (!confirming) return
    setClearing(true)
    setClearError(null)
    try {
      setReport(await clearRooms(guildId, confirming.map((r) => r.id)))
    } catch (e) {
      if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("clear dynamic rooms failed", e)
        setClearError("清除失敗，請稍後再試。")
      }
    } finally {
      setClearing(false)
      setConfirming(null)
    }
    // 不論成功或失敗都重新載入，清單以 Discord 目前的狀態為準
    await load()
  }

  return (
    <section id="rooms" className="scroll-mt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">
          動態房間 {rooms && <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">{rooms.length}</span>}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={emptyRooms.length === 0 || clearing}
            onClick={() => setConfirming(emptyRooms)}
          >
            清除所有空房
          </Button>
          <Button type="button" size="sm" disabled={loading || clearing} onClick={() => void load()}>
            重新整理
          </Button>
        </div>
      </header>

      {report && <ClearReport results={report} onDismiss={() => setReport(null)} />}
      {clearError && (
        <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{clearError}</span>
        </p>
      )}

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入動態房間，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}
      {rooms === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {rooms &&
        (rooms.length === 0 ? (
          <p className={`py-8 ${muted}`}>目前沒有動態房間。有人進入大廳後，bot 建立的房間會列在這裡。</p>
        ) : (
          <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
            {rooms.map((room) => (
              <RoomRow key={room.id} room={room} onClear={(r) => setConfirming([r])} />
            ))}
          </ul>
        ))}

      <ConfirmDialog
        rooms={confirming}
        busy={clearing}
        onConfirm={() => void confirmClear()}
        onCancel={() => setConfirming(null)}
      />
    </section>
  )
}
