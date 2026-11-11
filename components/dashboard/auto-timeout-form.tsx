"use client"

import { useState } from "react"
import { Button, Input, Select } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { formatDuration } from "@/lib/dashboard-warnings"
import {
  AUTO_TIMEOUT_TIMES_RANGE,
  autoTimeoutValues,
  conflictStrings,
  DURATION_UNITS,
  parseSettingsProblem,
  saveSettings,
  splitSeconds,
  toSeconds,
  validateAutoTimeout,
  type DurationUnit,
  type SettingValues,
  type SettingsResponse,
} from "@/lib/dashboard-settings"
import { ConflictNotice } from "./conflict-notice"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"

function formatConflictValue(field: string, value: string | null) {
  if (value === null) return "無"
  if (field === "auto_timeout_enabled") return value === "true" ? "啟用" : "停用"
  if (field === "auto_timeout_times") return `${value} 次`
  if (field === "auto_timeout_seconds") return formatDuration(Number(value))
  return value
}

/**
 * 自動禁言設定：警告累計到指定次數就自動禁言。
 * 表單只送自己的三個欄位，語音時數開關不受影響。bot 缺少 Moderate Members 時在表單上方警告。
 * 父層以 `key` 綁定目前設定，儲存或重新載入後表單會用最新值重新初始化。
 */
export function AutoTimeoutForm({
  guildId,
  settings,
  onSaved,
}: {
  guildId: string
  settings: SettingsResponse
  onSaved: (next: SettingsResponse) => void
}) {
  const saved = autoTimeoutValues(settings)
  const initial = splitSeconds(saved.auto_timeout_seconds)
  const [enabled, setEnabled] = useState(saved.auto_timeout_enabled)
  const [times, setTimes] = useState(String(saved.auto_timeout_times))
  const [amount, setAmount] = useState(String(initial.amount))
  const [unit, setUnit] = useState<DurationUnit>(initial.unit)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: SettingValues; mine: SettingValues } | null>(null)

  const issue = settings.permission_issues.find((i) => i.permission === "Moderate Members")

  const save = async (mine: SettingValues, original: SettingValues) => {
    setBusy(true)
    try {
      onSaved(await saveSettings(guildId, mine, original))
      setConflict(null)
      setError(null)
    } catch (e) {
      const problem = parseSettingsProblem(e)
      if (problem) {
        setConflict({ current: problem.current, mine })
      } else if (e instanceof DashboardApiError && e.code === "invalid_request") {
        setError("設定值不在允許的範圍內，請檢查警告次數與禁言時長。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save auto timeout failed", e)
        window.alert("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const timesValue = Number(times)
    const seconds = toSeconds(Number(amount), unit)
    const problem = validateAutoTimeout(timesValue, seconds)
    if (problem) {
      setError(problem.message)
      return
    }
    setError(null)
    void save(
      { auto_timeout_enabled: enabled, auto_timeout_times: timesValue, auto_timeout_seconds: seconds },
      autoTimeoutValues(settings),
    )
  }

  return (
    <section id="auto-timeout" className="scroll-mt-6 mt-10">
      <h3 className="font-serif text-lg text-primary dark:text-silver">警告累計自動禁言</h3>
      <p className={`text-sm ${muted}`}>
        成員在本伺服器收到的警告，從最後一次禁言之後累計到指定次數，星羽會自動禁言他，並寫一筆執行者為星羽的禁言紀錄，累計歸零。
      </p>
      {issue && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>
            星羽缺少 {issue.permission} 權限：{issue.consequence}
          </span>
        </p>
      )}
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} disabled={busy} onChange={(e) => setEnabled(e.target.checked)} />
          啟用自動禁言
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="auto-timeout-times" className={`block text-sm ${muted}`}>
              警告次數（{AUTO_TIMEOUT_TIMES_RANGE[0]}～{AUTO_TIMEOUT_TIMES_RANGE[1]}）
            </label>
            <Input
              id="auto-timeout-times"
              type="number"
              inputMode="numeric"
              min={AUTO_TIMEOUT_TIMES_RANGE[0]}
              max={AUTO_TIMEOUT_TIMES_RANGE[1]}
              value={times}
              disabled={busy}
              onChange={(e) => setTimes(e.target.value)}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="auto-timeout-amount" className={`block text-sm ${muted}`}>
              禁言時長（1 分鐘到 7 天）
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                id="auto-timeout-amount"
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                disabled={busy}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
              <Select
                aria-label="時長單位"
                value={unit}
                disabled={busy}
                onChange={(e) => setUnit(e.target.value as DurationUnit)}
                className="w-28 shrink-0"
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          儲存
        </Button>
      </form>
      {conflict && (
        <div className="mt-4">
          <ConflictNotice
            subject="自動禁言設定"
            current={conflictStrings(conflict.current)}
            mine={conflictStrings(conflict.mine)}
            format={formatConflictValue}
            busy={busy}
            onOverwrite={() => void save(conflict.mine, conflict.current)}
          />
        </div>
      )}
    </section>
  )
}
