"use client"

import { useCallback, useState } from "react"
import { Button, Select } from "@/components/ui"
import { ChannelSelect } from "@/components/dashboard/channel-select"
import { WarnIcon } from "@/components/dashboard/icons"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  type ForwardGuildOption,
  type ForwardSetting,
  type ForwardValues,
  channelsOf,
  describeSetting,
  fetchForward,
  fetchForwardOptions,
  forwardProblemMessage,
  isDirty,
  parseForwardProblem,
  saveForward,
  valuesOf,
} from "@/lib/dashboard-channel-forward"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"

interface ViewProps {
  /** 目前儲存的設定 */
  setting: ForwardSetting
  /** 可選的伺服器與頻道；null 表示載入中 */
  guilds: ForwardGuildOption[] | null
  draft: ForwardValues
  /** 不能修改（不是析域登入或沒有 Discord）：只顯示目前設定 */
  readOnly: boolean
  dirty: boolean
  busy?: boolean
  error?: string | null
  onChange: (draft: ForwardValues) => void
  onSave: () => void
  onClear: () => void
}

/** 轉發設定：目前的伺服器與頻道、兩個選單、儲存與清除。 */
export function ForwardFormView({ setting, guilds, draft, readOnly, dirty, busy, error, onChange, onSave, onClear }: ViewProps) {
  const current = describeSetting(setting)
  const locked = busy || guilds === null
  const missingGuild = draft.guildId !== null && guilds !== null && !guilds.some((g) => g.id === draft.guildId)
  return (
    <div className="border border-champagne/30 px-4 py-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        目前設定：<span className="text-foreground-light dark:text-foreground-dark">{current ?? "尚未設定，不會轉發"}</span>
      </p>
      {!readOnly && (
        <>
          <label htmlFor="forward-guild" className="mt-4 block text-sm text-gray-600 dark:text-gray-400">
            伺服器
          </label>
          <Select
            id="forward-guild"
            className="mt-1"
            value={draft.guildId ?? ""}
            disabled={locked}
            onChange={(e) => onChange({ guildId: e.target.value || null, channelId: null })}
          >
            {guilds === null ? (
              <option value="">載入中…</option>
            ) : (
              <>
                <option value="">選擇伺服器</option>
                {missingGuild && <option value={draft.guildId ?? ""}>{draft.guildId}（無法使用）</option>}
                {guilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </>
            )}
          </Select>
          <label htmlFor="forward-channel" className="mt-3 block text-sm text-gray-600 dark:text-gray-400">
            頻道
          </label>
          <div className="mt-1">
            <ChannelSelect
              id="forward-channel"
              options={guilds === null ? null : channelsOf(guilds, draft.guildId)}
              value={draft.channelId}
              disabled={busy || draft.guildId === null}
              onChange={(channelId) => onChange({ ...draft, channelId })}
            />
          </div>
          {guilds !== null && guilds.length === 0 && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              沒有可選的伺服器：星羽要在伺服器內，而且你要有該伺服器的「管理頻道」權限。
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
              <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
              <span>{error}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" disabled={busy || !dirty || draft.channelId === null} onClick={onSave}>
              儲存
            </Button>
            <Button type="button" disabled={busy || setting.channel === null} onClick={onClear}>
              清除設定
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

interface Props {
  channelId: string
  setting: ForwardSetting
  onSaved: (setting: ForwardSetting) => void
}

/** 轉發設定表單（可修改時）；唯讀時只顯示目前設定，不載入選項。 */
export function ForwardForm({ channelId, setting, onSaved }: Props) {
  const readOnly = !setting.editable
  const fetcher = useCallback((signal: AbortSignal) => fetchForwardOptions(channelId, signal), [channelId])
  const { data, error: loadError, reload } = useLoad(readOnly ? null : fetcher)
  const leaveIfUnlinked = useChannelError()
  const [draft, setDraft] = useState<ForwardValues>(valuesOf(setting))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(values: ForwardValues) {
    setBusy(true)
    setError(null)
    try {
      const saved = await saveForward(channelId, values)
      setDraft(valuesOf(saved))
      onSaved(saved)
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseForwardProblem(e)
      if (problem) {
        setError(forwardProblemMessage(problem))
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save forward failed", e)
        setError("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  function clear() {
    if (!window.confirm("確定要清除轉發設定嗎？清除後事件不會再發到 Discord。")) return
    void run({ guildId: null, channelId: null })
  }

  if (loadError) {
    return (
      <div className="border border-champagne/30 px-4 py-6 text-center">
        <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入伺服器清單，請稍後再試。</p>
        <Button type="button" onClick={() => void reload()}>
          重新載入
        </Button>
      </div>
    )
  }

  return (
    <ForwardFormView
      setting={setting}
      guilds={readOnly ? [] : data?.guilds ?? null}
      draft={draft}
      readOnly={readOnly}
      dirty={isDirty(valuesOf(setting), draft)}
      busy={busy}
      error={error}
      onChange={setDraft}
      onSave={() => void run(draft)}
      onClear={clear}
    />
  )
}

/** 載入目前的轉發設定；頁面用。 */
export function useForwardSetting(channelId: string) {
  const fetcher = useCallback((signal: AbortSignal) => fetchForward(channelId, signal), [channelId])
  return useLoad(fetcher)
}
