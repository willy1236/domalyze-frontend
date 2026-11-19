"use client"

import { useState } from "react"
import { Button, Input, Textarea } from "@/components/ui"
import { LabelWithCount } from "@/components/dashboard/char-count"
import { ConflictNotice } from "@/components/dashboard/conflict-notice"
import { WarnIcon } from "@/components/dashboard/icons"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  type ChannelTimer,
  createTimer,
  deleteTimer,
  EMPTY_TIMER,
  formatConflictField,
  fromConflictValues,
  INTERVAL_MAX,
  INTERVAL_MIN,
  MESSAGE_MAX,
  MIN_LINES_MAX,
  parseSaveProblem,
  saveTimer,
  TIMER_VARIABLES,
  TIMERS_MAX,
  type TimerValues,
  toConflictValues,
  valuesOf,
} from "@/lib/dashboard-channel-timers"
import { charLength } from "@/lib/dashboard-message"
import { useChannelError } from "./channel-access-guard"

interface Props {
  channelId: string
  /** 編輯中的計時訊息；null 表示新增 */
  original: ChannelTimer | null
  onClose: () => void
  /** 新增、修改或刪除成功（含發現已不存在）後呼叫，讓清單重新載入 */
  onChanged: () => void
  /** 收到 channel_not_enabled：頻道的啟用狀態已經變了，重新載入頻道資料 */
  onNotEnabled: () => void
}

interface Base {
  id: number
  values: TimerValues
}

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"

function FieldError({ reason }: { reason?: string }) {
  if (!reason) return null
  return (
    <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{reason}</span>
    </p>
  )
}

/** 訊息欄下方的變數說明。 */
export function TimerVariables() {
  return (
    <details className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      <summary className="cursor-pointer">可用的變數</summary>
      <ul className="mt-2 space-y-1">
        {TIMER_VARIABLES.map((v) => (
          <li key={v.token}>
            <code className="font-mono text-primary dark:text-silver">{v.token}</code>：{v.description}
          </li>
        ))}
      </ul>
      <p className="mt-2">
        計時訊息沒有觸發的人，所以不能用 {"{user}"}、{"{touser}"}、{"{args}"}、{"{count}"}。不認得的變數會原樣送出。
      </p>
    </details>
  )
}

function toNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text)
}

export function TimerForm({ channelId, original, onClose, onChanged, onNotEnabled }: Props) {
  const initial = original ? valuesOf(original) : EMPTY_TIMER
  const [base, setBase] = useState<Base | null>(original ? { id: original.id, values: valuesOf(original) } : null)
  const [message, setMessage] = useState(initial.message)
  const [intervalText, setIntervalText] = useState(String(initial.interval_minutes))
  const [minLines, setMinLines] = useState(String(initial.min_chat_lines))
  const [enabled, setEnabled] = useState(initial.enabled)
  const leaveIfUnlinked = useChannelError()
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: Record<string, string | null> | null; mine: TimerValues } | null>(null)

  const apply = (values: TimerValues) => {
    setMessage(values.message)
    setIntervalText(String(values.interval_minutes))
    setMinLines(String(values.min_chat_lines))
    setEnabled(values.enabled)
  }

  const currentValues = (): TimerValues => ({
    message,
    interval_minutes: toNumber(intervalText),
    min_chat_lines: toNumber(minLines),
    enabled,
  })

  /** 送出前擋下明顯的錯誤，回傳欄位對應的提示（空物件表示通過）；其餘規則由後端判斷。 */
  const localProblems = (v: TimerValues): Record<string, string> => {
    const problems: Record<string, string> = {}
    if (!v.message.trim()) problems.message = "請輸入訊息內容"
    if (!Number.isInteger(v.interval_minutes) || v.interval_minutes < INTERVAL_MIN || v.interval_minutes > INTERVAL_MAX) {
      problems.interval_minutes = `間隔請輸入 ${INTERVAL_MIN} 到 ${INTERVAL_MAX} 的整數（分鐘）`
    }
    if (!Number.isInteger(v.min_chat_lines) || v.min_chat_lines < 0 || v.min_chat_lines > MIN_LINES_MAX) {
      problems.min_chat_lines = `最少聊天量請輸入 0 到 ${MIN_LINES_MAX} 的整數`
    }
    return problems
  }

  function reset() {
    setBusy(true)
    setFieldErrors({})
    setNotice(null)
    setConflict(null)
  }

  async function submit(against: Base | null) {
    const mine = currentValues()
    const problems = localProblems(mine)
    if (Object.keys(problems).length > 0) {
      setFieldErrors(problems)
      return
    }
    reset()
    try {
      if (against === null) await createTimer(channelId, mine)
      else await saveTimer(channelId, against.id, mine, against.values)
      onChanged()
      onClose()
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict") {
        setConflict({ current: problem.current, mine })
      } else if (problem?.kind === "invalid_field" && problem.field === "limit") {
        setNotice(`已達上限，每個頻道最多 ${TIMERS_MAX} 則計時訊息。`)
      } else if (problem?.kind === "invalid_field") {
        setFieldErrors({ [problem.field]: problem.reason })
      } else if (problem?.kind === "automod_blocked") {
        setFieldErrors({ message: "這段訊息會被頻道的 AutoMod 擋下，請修改內容。" })
      } else if (problem?.kind === "automod_unavailable") {
        setNotice("目前無法檢查 AutoMod，請稍後再試。")
      } else if (problem?.kind === "not_enabled") {
        onNotEnabled()
        onClose()
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save timer failed", e)
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!base) return
    if (!window.confirm("確定要刪除這則計時訊息嗎？刪除後星羽就不會再發送它。")) return
    reset()
    try {
      await deleteTimer(channelId, base.id, base.values)
      onChanged()
      onClose()
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict" && problem.current === null) {
        // 已被別人刪除：目的已達成，重新載入清單
        onChanged()
        onClose()
      } else if (problem?.kind === "conflict" && problem.current) {
        // 已被修改：表單換成最新內容，請使用者確認後再決定
        const latest = fromConflictValues(problem.current)
        setBase({ id: base.id, values: latest })
        apply(latest)
        setNotice("這則計時訊息已在你編輯期間被修改，表單已更新成最新內容，請確認後再決定是否刪除。")
      } else if (problem?.kind === "not_enabled") {
        onNotEnabled()
        onClose()
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete timer failed", e)
        setNotice("刪除失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="mt-4 space-y-5 rounded-md border border-primary/20 dark:border-champagne/25 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit(base)
      }}
    >
      <h3 className="font-serif text-lg text-primary dark:text-silver">{base === null ? "新增計時訊息" : "編輯計時訊息"}</h3>

      <div>
        <label htmlFor="timer-message" className={labelClass}>
          <LabelWithCount used={charLength(message)} max={MESSAGE_MAX}>
            訊息內容
          </LabelWithCount>
        </label>
        <Textarea id="timer-message" rows={3} value={message} disabled={busy} onChange={(e) => setMessage(e.target.value)} />
        <FieldError reason={fieldErrors.message} />
        <TimerVariables />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="timer-interval" className={labelClass}>
            發送間隔（分鐘，{INTERVAL_MIN}～{INTERVAL_MAX}）
          </label>
          <Input
            id="timer-interval"
            type="number"
            min={INTERVAL_MIN}
            max={INTERVAL_MAX}
            value={intervalText}
            disabled={busy}
            onChange={(e) => setIntervalText(e.target.value)}
          />
          <FieldError reason={fieldErrors.interval_minutes} />
        </div>
        <div>
          <label htmlFor="timer-min-lines" className={labelClass}>
            最少聊天量（則，0～{MIN_LINES_MAX}）
          </label>
          <Input
            id="timer-min-lines"
            type="number"
            min={0}
            max={MIN_LINES_MAX}
            value={minLines}
            disabled={busy}
            onChange={(e) => setMinLines(e.target.value)}
          />
          <FieldError reason={fieldErrors.min_chat_lines} />
        </div>
      </div>
      <p className="-mt-2 text-sm text-gray-600 dark:text-gray-400">
        間隔到了之後，距離上次發送要累積到這麼多則聊天才會發送，聊天室安靜時不會洗版；0 表示不限制。星羽自己的訊息不計入。
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} disabled={busy} onChange={(e) => setEnabled(e.target.checked)} />
        啟用這則計時訊息（關閉後星羽不會發送）
      </label>

      {conflict && (
        <ConflictNotice
          current={conflict.current}
          mine={toConflictValues(conflict.mine)}
          format={formatConflictField}
          busy={busy}
          subject="這則計時訊息"
          onOverwrite={(latest) => {
            const next = { id: base?.id ?? 0, values: fromConflictValues(latest) }
            setBase(next)
            void submit(next)
          }}
          onRecreate={() => {
            setBase(null)
            void submit(null)
          }}
        />
      )}
      {notice && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{notice}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          儲存
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
        {base !== null && (
          <Button variant="danger" type="button" disabled={busy} onClick={() => void remove()} className="ml-auto">
            刪除
          </Button>
        )}
      </div>
    </form>
  )
}
