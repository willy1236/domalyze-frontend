"use client"

import { type ReactNode, useCallback, useState } from "react"
import { Button, Textarea } from "@/components/ui"
import { LabelWithCount } from "@/components/dashboard/char-count"
import { ConflictNotice } from "@/components/dashboard/conflict-notice"
import { WarnIcon } from "@/components/dashboard/icons"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  type ConflictValues,
  type EventResponse,
  type EventValues,
  eventMeta,
  fetchEventResponses,
  formatConflictField,
  fromConflictValues,
  isDirty,
  parseSaveProblem,
  resetEventResponse,
  saveEventResponse,
  TEMPLATE_MAX,
  toConflictValues,
  valuesOf,
} from "@/lib/dashboard-channel-events"
import { charLength } from "@/lib/dashboard-message"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"

interface ViewProps {
  response: EventResponse
  /** 目前的草稿 */
  draft: EventValues
  /** 目前套用中的設定是不是預設文字 */
  isDefault: boolean
  dirty: boolean
  /** 頻道的星羽還沒啟用：只能看，不能改 */
  readOnly: boolean
  busy?: boolean
  error?: string | null
  notice?: string | null
  conflict?: ReactNode
  onChange: (draft: EventValues) => void
  onSave: () => void
  onReset: () => void
}

/** 一種事件的設定：開關、文字、可用變數、儲存與恢復預設。 */
export function EventRowView({
  response,
  draft,
  isDefault,
  dirty,
  readOnly,
  busy,
  error,
  notice,
  conflict,
  onChange,
  onSave,
  onReset,
}: ViewProps) {
  const meta = eventMeta(response.kind)
  const inputId = `event-${response.kind}`
  const locked = readOnly || busy
  return (
    <li className="border border-champagne/30 px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="flex-1 font-medium">
          {meta.label}
          {isDefault && <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">（預設文字）</span>}
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.enabled}
            disabled={locked}
            onChange={(e) => onChange({ ...draft, enabled: e.target.checked })}
            aria-label={`${meta.label}回應`}
          />
          啟用
        </label>
      </div>
      <label htmlFor={inputId} className="mt-3 block text-sm text-gray-600 dark:text-gray-400">
        <LabelWithCount used={charLength(draft.template)} max={TEMPLATE_MAX}>
          回應文字
        </LabelWithCount>
      </label>
      <Textarea
        id={inputId}
        rows={2}
        className="mt-1"
        value={draft.template}
        disabled={locked}
        onChange={(e) => onChange({ ...draft, template: e.target.value })}
      />
      {error && (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{error}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        可用的變數：
        {response.variables.map((v) => (
          <span key={v.token} className="mr-3">
            <code className="font-mono text-primary dark:text-silver">{v.token}</code> {v.description}
          </span>
        ))}
      </p>
      {meta.note && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{meta.note}</p>}
      {conflict}
      {notice && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {notice}
        </p>
      )}
      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" disabled={busy || !dirty} onClick={onSave}>
            儲存
          </Button>
          <Button type="button" disabled={busy || isDefault} onClick={onReset}>
            恢復預設
          </Button>
        </div>
      )}
    </li>
  )
}

interface RowProps {
  channelId: string
  response: EventResponse
  readOnly: boolean
  onNotEnabled: () => void
}

function EventRow({ channelId, response, readOnly, onNotEnabled }: RowProps) {
  // 打開頁面（或上次儲存成功）時的有效設定，PUT／DELETE 的 original
  const [base, setBase] = useState<EventResponse>(response)
  const [draft, setDraft] = useState<EventValues>(valuesOf(response))
  const leaveIfUnlinked = useChannelError()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: ConflictValues; mine: EventValues } | null>(null)

  async function run(request: Promise<{ event_response: EventResponse }>, mine: EventValues) {
    try {
      const saved = (await request).event_response
      setBase(saved)
      setDraft(valuesOf(saved))
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict" && problem.current) {
        setConflict({ current: problem.current, mine })
      } else if (problem?.kind === "invalid_field") {
        setError(problem.reason)
      } else if (problem?.kind === "automod_blocked") {
        setError("這段文字會被頻道的 AutoMod 擋下，請修改內容。")
      } else if (problem?.kind === "automod_unavailable") {
        setNotice("目前無法檢查 AutoMod，請稍後再試。")
      } else if (problem?.kind === "not_enabled") {
        onNotEnabled()
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save event response failed", e)
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  function start() {
    setBusy(true)
    setError(null)
    setNotice(null)
    setConflict(null)
  }

  function save(original: EventValues) {
    if (!draft.template.trim()) {
      setError("請輸入回應文字")
      return
    }
    start()
    void run(saveEventResponse(channelId, base.kind, draft, original), draft)
  }

  function reset() {
    if (!window.confirm(`確定要把「${eventMeta(base.kind).label}」恢復成預設文字嗎？目前自訂的文字會被刪除。`)) return
    start()
    void run(resetEventResponse(channelId, base.kind, valuesOf(base)), draft)
  }

  return (
    <EventRowView
      response={base}
      draft={draft}
      isDefault={base.is_default}
      dirty={isDirty(valuesOf(base), draft)}
      readOnly={readOnly}
      busy={busy}
      error={error}
      notice={notice}
      onChange={setDraft}
      onSave={() => save(valuesOf(base))}
      onReset={reset}
      conflict={
        conflict && (
          <div className="mt-3">
            <ConflictNotice
              current={conflict.current}
              mine={toConflictValues(conflict.mine)}
              format={formatConflictField}
              busy={busy}
              subject="這個事件回應"
              onOverwrite={(latest) => {
                const original = fromConflictValues(latest)
                setBase({ ...base, ...original })
                save(original)
              }}
            />
          </div>
        )
      }
    />
  )
}

interface Props {
  channelId: string
  readOnly: boolean
  /** 收到 channel_not_enabled：頻道的啟用狀態已經變了，重新載入頻道資料 */
  onNotEnabled: () => void
}

/** 頻道的事件回應：六種事件各一列。 */
export function EventResponseList({ channelId, readOnly, onNotEnabled }: Props) {
  const fetcher = useCallback((signal: AbortSignal) => fetchEventResponses(channelId, signal), [channelId])
  const { data, error, reload } = useLoad(fetcher)

  return (
    <div>
      {readOnly && (
        <p className="mb-4 border border-champagne/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          星羽還沒有在這個頻道啟用，啟用後才能修改事件回應。
        </p>
      )}
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
        <ul className="space-y-4">
          {data.event_responses.map((response) => (
            <EventRow
              key={response.kind}
              channelId={channelId}
              response={response}
              readOnly={readOnly}
              onNotEnabled={onNotEnabled}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
