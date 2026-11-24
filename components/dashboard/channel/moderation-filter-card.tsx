"use client"

import { useState, type FormEvent } from "react"
import { Button, Input, Select } from "@/components/ui"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { useChannelError, useReloadChannel } from "./channel-access-guard"
import { FIRST_STAGE, ModerationStageEditor, stageProblem, type ModerationStage } from "./moderation-stage-editor"

type ExemptLevel = "subscriber" | "regular" | "vip" | "mod"

interface FilterValues {
  enabled: boolean
  exempt_level: ExemptLevel
  params: Record<string, number | string[]>
  notice: string | null
  silent: boolean
  stages: ModerationStage[] | null
}

export interface ModerationFilter extends FilterValues {
  kind: keyof typeof FILTERS
  updated_at: string | null
}

type ListField = {
  key: string
  label: string
  description: string
  placeholder?: string
}

type NumberField = {
  key: string
  label: string
  defaultValue: number
  bounds: readonly [number, number]
}

type FilterDefinition = {
  title: string
  list?: ListField
  numbers?: readonly NumberField[]
}

const LIST_MAX = 100
const ENTRY_MAX = 100
const COUNT_RANGE = [1, 500] as const
const PERCENT_RANGE = [1, 100] as const
const DUPLICATE_SECONDS_RANGE = [1, 300] as const
const DUPLICATE_COUNT_RANGE = [2, 100] as const

const FILTERS = {
  link: {
    title: "連結過濾",
    list: {
      key: "whitelist",
      label: "白名單",
      description: "每行一個網域或路徑。",
      placeholder: "youtube.com\ntwitter.com/abc",
    },
  },
  blocked_word: {
    title: "禁字過濾",
    list: { key: "words", label: "禁字清單", description: "每行一項，* 代表任意長度的文字。" },
  },
  caps: {
    title: "大寫過濾",
    numbers: [
      { key: "min_count", label: "大寫字母數", defaultValue: 8, bounds: COUNT_RANGE },
      { key: "min_percent", label: "大寫比例（%）", defaultValue: 70, bounds: PERCENT_RANGE },
    ],
  },
  emote: {
    title: "表情符號過多",
    numbers: [{ key: "min_count", label: "表情數", defaultValue: 3, bounds: COUNT_RANGE }],
  },
  symbol: {
    title: "符號過多",
    numbers: [{ key: "min_count", label: "符號數", defaultValue: 8, bounds: COUNT_RANGE }],
  },
  repetition: {
    title: "重複內容",
    numbers: [{ key: "min_percent", label: "重複比例（%）", defaultValue: 45, bounds: PERCENT_RANGE }],
  },
  length: {
    title: "訊息過長",
    numbers: [{ key: "min_length", label: "訊息字元數", defaultValue: 300, bounds: COUNT_RANGE }],
  },
  duplicate: {
    title: "跨訊息重複",
    numbers: [
      { key: "window_seconds", label: "比對時間（秒）", defaultValue: 30, bounds: DUPLICATE_SECONDS_RANGE },
      { key: "min_count", label: "相同訊息則數", defaultValue: 3, bounds: DUPLICATE_COUNT_RANGE },
    ],
  },
} satisfies Record<string, FilterDefinition>

function parameterInputs(definition: FilterDefinition, params: FilterValues["params"]): Record<string, string> {
  if (definition.list) {
    const entries = params[definition.list.key]
    return { [definition.list.key]: Array.isArray(entries) ? entries.join("\n") : "" }
  }
  return Object.fromEntries(
    (definition.numbers ?? []).map(({ key, defaultValue }) => [key, String(params[key] ?? defaultValue)]),
  )
}

const LEVELS: Record<ExemptLevel, string> = {
  subscriber: "訂閱者以上",
  regular: "常客以上",
  vip: "VIP 以上",
  mod: "mod 以上",
}

const fieldClass = "w-full border border-champagne/40 bg-transparent px-3 py-2 text-sm disabled:opacity-60"

function valuesOf({ enabled, exempt_level, params, notice, silent, stages }: ModerationFilter): FilterValues {
  return { enabled, exempt_level, params, notice, silent, stages }
}

interface Props {
  filter: ModerationFilter
  endpoint: string
  disabled: boolean
  onReload: () => Promise<void>
}

export function ModerationFilterCard({ filter, endpoint, disabled, onReload }: Props) {
  const definition: FilterDefinition = FILTERS[filter.kind]
  const { title, list, numbers = [] } = definition
  const [original, setOriginal] = useState(() => valuesOf(filter))
  const [draft, setDraft] = useState(original)
  const [useCustomStages, setUseCustomStages] = useState(original.stages !== null)
  const stages = draft.stages ?? FIRST_STAGE
  const [params, setParams] = useState(() => parameterInputs(definition, original.params))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "conflict">("idle")
  const [problem, setProblem] = useState("")
  const handleChannelError = useChannelError()
  const reloadChannel = useReloadChannel()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("idle")
    setProblem("")
    const values: FilterValues = { ...draft, params: {}, stages: useCustomStages ? stages : null }
    const invalidStage = values.stages && stageProblem(values.stages)
    if (invalidStage) {
      setProblem(invalidStage)
      return
    }
    if (list) {
      const entries = params[list.key].split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
      if (entries.length > LIST_MAX || entries.some((entry) => Array.from(entry).length > ENTRY_MAX)) {
        setProblem(`${list.label}最多 ${LIST_MAX} 項，每項最多 ${ENTRY_MAX} 字。`)
        return
      }
      values.params[list.key] = entries
    }
    for (const { key, label, bounds: [min, max] } of numbers) {
      const value = Number(params[key])
      if (!Number.isInteger(value) || value < min || value > max) {
        setProblem(`${label}必須是 ${min} 到 ${max} 的整數。`)
        return
      }
      values.params[key] = value
    }
    setSaving(true)
    try {
      const response = await dashboardFetch<{ filter: ModerationFilter }>(endpoint, {
        method: "PUT",
        json: { values, original },
      })
      const saved = valuesOf(response.filter)
      setOriginal(saved)
      setDraft(saved)
      setUseCustomStages(saved.stages !== null)
      setParams(parameterInputs(definition, saved.params))
      setStatus("saved")
    } catch (error) {
      if (handleChannelError(error)) return
      if (error instanceof DashboardApiError) {
        switch (error.code) {
          case "automod_blocked":
            setProblem("告知文字被 AutoMod 擋下，請修改後再儲存。")
            return
          case "automod_unavailable":
            setProblem("目前無法檢查 AutoMod，請稍後再試。")
            return
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
      setProblem(`無法儲存${title}設定，請稍後再試。`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="max-w-2xl border border-champagne/30">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between gap-3 p-5 sm:px-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {original.enabled ? "已啟用" : "未啟用"}
            <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
          </span>
        </summary>
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <fieldset disabled={disabled || saving} className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={draft.enabled}
                onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
              啟用{title}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">豁免層級</span>
              <Select value={draft.exempt_level}
                onChange={(event) => setDraft({ ...draft, exempt_level: event.target.value as ExemptLevel })}>
                {Object.entries(LEVELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </label>
            {list && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{list.label}</span>
                <textarea
                  className={fieldClass}
                  rows={3}
                  placeholder={list.placeholder}
                  value={params[list.key]}
                  onChange={(event) => setParams({ ...params, [list.key]: event.target.value })}
                />
                <span className="text-gray-600 dark:text-gray-400">{list.description}最多 {LIST_MAX} 項，每項最多 {ENTRY_MAX} 字。</span>
              </label>
            )}
            {numbers.map(({ key, label, bounds: [min, max] }) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block font-medium">{label}</span>
                <Input
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  required
                  value={params[key]}
                  onChange={(event) => setParams({ ...params, [key]: event.target.value })}
                />
              </label>
            ))}
            <label className="block text-sm">
              <span className="mb-1 block font-medium">告知文字</span>
              <Input type="text" value={draft.notice ?? ""} placeholder="使用預設文字"
                onChange={(event) => setDraft({ ...draft, notice: event.target.value || null })} />
              <span className="mt-1 block text-gray-600 dark:text-gray-400">
                {"可用 {user} 代入觀眾名稱，{filter} 代入過濾器名稱。"}
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.silent}
                onChange={(event) => setDraft({ ...draft, silent: event.target.checked })} />
              靜音
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={useCustomStages}
                onChange={(event) => setUseCustomStages(event.target.checked)}
              />
              使用自己的處罰階段
            </label>
            {useCustomStages && (
              <ModerationStageEditor stages={stages} onChange={(next) => setDraft({ ...draft, stages: next })} />
            )}
            <Button type="submit" disabled={status === "conflict"}>{saving ? "儲存中…" : "儲存"}</Button>
          </fieldset>
          {problem && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{problem}</p>}
          {status === "conflict" && (
            <Button type="button" className="mt-3" disabled={disabled} onClick={() => void onReload()}>
              重新載入設定
            </Button>
          )}
          {status === "saved" && <p className="mt-3 text-sm" role="status">已儲存{title}設定。</p>}
        </div>
      </details>
    </form>
  )
}
