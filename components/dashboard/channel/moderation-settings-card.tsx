"use client"

import { useState, type FormEvent } from "react"
import { Button, Input } from "@/components/ui"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { useChannelError, useReloadChannel } from "./channel-access-guard"
import { ModerationStageEditor, stageProblem, type ModerationStage } from "./moderation-stage-editor"

interface SettingsValues {
  stages: ModerationStage[]
  strike_reset_minutes: number
  permit_seconds: number
  raid_pause_seconds: number
}

export interface ModerationSettings extends SettingsValues {
  updated_at: string | null
}

const TIME_FIELDS = [
  { key: "strike_reset_minutes", label: "犯規次數歸零（分鐘）", min: 1, max: 1440 },
  { key: "permit_seconds", label: "放行時間（秒）", min: 10, max: 600 },
  { key: "raid_pause_seconds", label: "Raid 後暫停（秒）", min: 0, max: 600 },
] as const

interface Props {
  settings: ModerationSettings
  endpoint: string
  disabled: boolean
  onReload: () => Promise<void>
}

function valuesOf({ stages, strike_reset_minutes, permit_seconds, raid_pause_seconds }: ModerationSettings): SettingsValues {
  return { stages, strike_reset_minutes, permit_seconds, raid_pause_seconds }
}

function timeInputs(values: SettingsValues) {
  return {
    strike_reset_minutes: String(values.strike_reset_minutes),
    permit_seconds: String(values.permit_seconds),
    raid_pause_seconds: String(values.raid_pause_seconds),
  }
}

export function ModerationSettingsCard({ settings, endpoint, disabled, onReload }: Props) {
  const [original, setOriginal] = useState(() => valuesOf(settings))
  const [stages, setStages] = useState(original.stages)
  const [times, setTimes] = useState(() => timeInputs(original))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "conflict">("idle")
  const [problem, setProblem] = useState("")
  const handleChannelError = useChannelError()
  const reloadChannel = useReloadChannel()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("idle")
    setProblem("")
    const invalidStage = stageProblem(stages)
    if (invalidStage) {
      setProblem(invalidStage)
      return
    }

    const values: SettingsValues = { ...original, stages }
    for (const { key, label, min, max } of TIME_FIELDS) {
      const value = Number(times[key])
      if (!Number.isInteger(value) || value < min || value > max) {
        setProblem(`${label}必須是 ${min} 到 ${max} 的整數。`)
        return
      }
      values[key] = value
    }

    setSaving(true)
    try {
      const response = await dashboardFetch<{ settings: ModerationSettings }>(endpoint, {
        method: "PUT",
        json: { values, original },
      })
      const saved = valuesOf(response.settings)
      setOriginal(saved)
      setStages(saved.stages)
      setTimes(timeInputs(saved))
      setStatus("saved")
    } catch (error) {
      if (handleChannelError(error)) return
      if (error instanceof DashboardApiError) {
        switch (error.code) {
          case "invalid_field":
            setProblem(typeof error.body?.reason === "string" ? error.body.reason : "請檢查欄位內容。")
            return
          case "conflict":
            setStatus("conflict")
            setProblem("設定已被更新。請重新載入後再編輯。")
            return
          case "channel_not_enabled":
            await reloadChannel()
            setProblem("星羽尚未啟用，目前無法儲存。")
            return
        }
        if (error.handled) return
      }
      setProblem("無法儲存處罰設定，請稍後再試。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="max-w-2xl border border-champagne/30 p-5 sm:p-6">
      <h3 className="mb-4 text-lg font-semibold">處罰設定</h3>
      <fieldset disabled={disabled || saving} className="space-y-4">
        <ModerationStageEditor stages={stages} onChange={setStages} />
        <div className="grid gap-4 sm:grid-cols-2">
          {TIME_FIELDS.map(({ key, label, min, max }) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <Input
                type="number"
                min={min}
                max={max}
                step={1}
                required
                value={times[key]}
                onInput={(event) => {
                  const value = event.currentTarget.value
                  setTimes((current) => ({ ...current, [key]: value }))
                }}
              />
            </label>
          ))}
        </div>
        <Button type="submit" disabled={status === "conflict"}>{saving ? "儲存中…" : "儲存"}</Button>
      </fieldset>
      {problem && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{problem}</p>}
      {status === "conflict" && (
        <Button type="button" className="mt-3" disabled={disabled} onClick={() => void onReload()}>
          重新載入設定
        </Button>
      )}
      {status === "saved" && <p className="mt-3 text-sm" role="status">已儲存處罰設定。</p>}
    </form>
  )
}
