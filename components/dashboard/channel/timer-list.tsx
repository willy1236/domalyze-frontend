"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  atTimerLimit,
  type ChannelTimer,
  fetchTimers,
  parseSaveProblem,
  saveTimer,
  TIMERS_MAX,
  timerSummary,
  valuesOf,
} from "@/lib/dashboard-channel-timers"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"
import { TimerForm } from "./timer-form"

interface RowsProps {
  timers: ChannelTimer[]
  /** 頻道的星羽還沒啟用：只能看，不能改 */
  readOnly: boolean
  busy?: boolean
  onEdit: (timer: ChannelTimer) => void
  onToggle: (timer: ChannelTimer) => void
}

/** 計時訊息清單；沒有計時訊息時顯示空狀態。 */
export function TimerRows({ timers, readOnly, busy, onEdit, onToggle }: RowsProps) {
  if (timers.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">還沒有計時訊息。</p>
  }
  return (
    <ul className="divide-y divide-champagne/20 border border-champagne/30">
      {timers.map((timer) => (
        <li key={timer.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className={timer.enabled ? "break-words" : "break-words text-gray-500 dark:text-gray-400"}>
              {timer.message}
              {!timer.enabled && <span className="ml-2 text-sm">（已關閉）</span>}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{timerSummary(timer)}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={timer.enabled}
              disabled={readOnly || busy}
              onChange={() => onToggle(timer)}
              aria-label={`${timer.enabled ? "關閉" : "開啟"}計時訊息：${timer.message}`}
            />
            啟用
          </label>
          <Button type="button" disabled={readOnly || busy} onClick={() => onEdit(timer)}>
            編輯
          </Button>
        </li>
      ))}
    </ul>
  )
}

interface Props {
  channelId: string
  readOnly: boolean
  /** 收到 channel_not_enabled：頻道的啟用狀態已經變了，重新載入頻道資料 */
  onNotEnabled: () => void
}

/** 頻道的計時訊息管理：清單、新增、編輯、刪除與開關。 */
export function TimerList({ channelId, readOnly, onNotEnabled }: Props) {
  const fetcher = useCallback((signal: AbortSignal) => fetchTimers(channelId, signal), [channelId])
  const { data, error, reload } = useLoad(fetcher)
  // undefined：沒有開表單；null：新增；計時訊息：編輯
  const [editing, setEditing] = useState<ChannelTimer | null | undefined>(undefined)
  const leaveIfUnlinked = useChannelError()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function toggle(timer: ChannelTimer) {
    const original = valuesOf(timer)
    setBusy(true)
    setNotice(null)
    try {
      await saveTimer(channelId, timer.id, { ...original, enabled: !timer.enabled }, original)
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "not_enabled") onNotEnabled()
      else if (problem?.kind === "conflict") setNotice("這則計時訊息剛被別人修改，已重新載入，請確認後再操作。")
      else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("toggle timer failed", e)
        setNotice("操作失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
      await reload()
    }
  }

  const full = data !== null && atTimerLimit(data.timers.length)

  return (
    <div>
      {readOnly && (
        <p className="mb-4 border border-champagne/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          星羽還沒有在這個頻道啟用，啟用後才能修改計時訊息。
        </p>
      )}
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        開台中，星羽會依設定的間隔在聊天室發送；開台後第一則要等滿一個間隔，沒開台時不會發送。設了最少聊天量時，間隔到了還要累積足夠的聊天（星羽自己的訊息不算）才會發。
      </p>
      {error ? (
        <div className="border border-champagne/30 px-4 py-6 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入，請稍後再試。</p>
          <Button type="button" onClick={() => void reload()}>
            重新載入
          </Button>
        </div>
      ) : data === null ? (
        <div className="min-h-[10vh]" aria-busy="true" />
      ) : (
        <>
          <TimerRows timers={data.timers} readOnly={readOnly} busy={busy} onEdit={setEditing} onToggle={(t) => void toggle(t)} />
          {notice && (
            <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
              {notice}
            </p>
          )}
          {editing === undefined && !readOnly && (
            <>
              <Button type="button" className="mt-4" disabled={full} onClick={() => setEditing(null)}>
                新增計時訊息
              </Button>
              {full && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  已達上限，每個頻道最多 {TIMERS_MAX} 則計時訊息。刪除不用的才能再新增。
                </p>
              )}
            </>
          )}
        </>
      )}
      {editing !== undefined && !readOnly && (
        <TimerForm
          // 換一則就重新掛載，表單才會帶入新的初始值
          key={editing?.id ?? "new"}
          channelId={channelId}
          original={editing}
          onClose={() => setEditing(undefined)}
          onChanged={() => void reload()}
          onNotEnabled={onNotEnabled}
        />
      )}
    </div>
  )
}
