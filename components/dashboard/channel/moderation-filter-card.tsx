"use client"

import { useState, type FormEvent } from "react"
import { Button, Input } from "@/components/ui"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { useChannelError, useReloadChannel } from "./channel-access-guard"

type ExemptLevel = "subscriber" | "regular" | "vip" | "mod"

interface LinkValues {
  enabled: boolean
  exempt_level: ExemptLevel
  params: { whitelist: string[] }
  notice: string | null
  silent: boolean
}

export interface LinkFilter extends LinkValues {
  kind: string
  updated_at: string | null
}

const LEVELS: Record<ExemptLevel, string> = {
  subscriber: "訂閱者以上",
  regular: "常客以上",
  vip: "VIP 以上",
  mod: "mod 以上",
}

const fieldClass = "w-full border border-champagne/40 bg-transparent px-3 py-2 text-sm disabled:opacity-60"

function valuesOf({ enabled, exempt_level, params, notice, silent }: LinkFilter): LinkValues {
  return { enabled, exempt_level, params, notice, silent }
}

interface Props {
  filter: LinkFilter
  endpoint: string
  disabled: boolean
  onReload: () => Promise<void>
}

export function ModerationFilterCard({ filter, endpoint, disabled, onReload }: Props) {
  const [original, setOriginal] = useState(() => valuesOf(filter))
  const [draft, setDraft] = useState(original)
  const [whitelist, setWhitelist] = useState(original.params.whitelist.join("\n"))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "conflict">("idle")
  const [problem, setProblem] = useState("")
  const handleChannelError = useChannelError()
  const reloadChannel = useReloadChannel()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus("idle")
    setProblem("")
    const values: LinkValues = {
      ...draft,
      params: { whitelist: whitelist.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean) },
    }
    try {
      const response = await dashboardFetch<{ filter: LinkFilter }>(endpoint, {
        method: "PUT",
        json: { values, original },
      })
      const saved = valuesOf(response.filter)
      setOriginal(saved)
      setDraft(saved)
      setWhitelist(saved.params.whitelist.join("\n"))
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
      setProblem("無法儲存連結過濾設定，請稍後再試。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="max-w-2xl border border-champagne/30 p-5 sm:p-6">
      <h3 className="mb-4 text-lg font-semibold">連結過濾</h3>
      <fieldset disabled={disabled || saving} className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={draft.enabled}
            onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
          啟用連結過濾
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">豁免層級</span>
          <select className={fieldClass} value={draft.exempt_level}
            onChange={(event) => setDraft({ ...draft, exempt_level: event.target.value as ExemptLevel })}>
            {Object.entries(LEVELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">白名單</span>
          <textarea
            className={fieldClass}
            rows={3}
            placeholder={"youtube.com\ntwitter.com/abc"}
            value={whitelist}
            onChange={(event) => setWhitelist(event.target.value)}
          />
          <span className="text-gray-600 dark:text-gray-400">每行一個網域或路徑。</span>
        </label>
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
        <Button type="submit" disabled={status === "conflict"}>{saving ? "儲存中…" : "儲存"}</Button>
      </fieldset>
      {problem && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{problem}</p>}
      {status === "conflict" && (
        <Button type="button" className="mt-3" disabled={disabled} onClick={() => void onReload()}>
          重新載入設定
        </Button>
      )}
      {status === "saved" && <p className="mt-3 text-sm" role="status">已儲存連結過濾設定。</p>}
    </form>
  )
}
