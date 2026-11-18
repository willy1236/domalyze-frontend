"use client"

import { useCallback, useEffect, useState } from "react"
import { dashboardFetch } from "@/lib/dashboard-api"
import { type PublicSettings, SECTION_OPTIONS, type SectionKey, publicPath, saveSettings, toggleSection } from "@/lib/dashboard-public"
import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { useLoad } from "@/lib/use-load"
import { PersonalSection } from "./personal-section"

const mutedClass = "text-sm text-gray-500 dark:text-gray-400"
const errorClass = "text-sm text-red-700 dark:text-red-300"

type Available = Extract<PublicSettings, { available: true }>

/** 公開設定的內容：開關、勾選與公開網址；每次操作都立即送出，沒有存檔鈕 */
export function PublicSettingsView({
  settings,
  origin,
  busy,
  error,
  onChange,
}: {
  settings: Available
  origin: string
  busy: boolean
  error: string | null
  onChange: (enabled: boolean, sections: SectionKey[]) => void
}) {
  const path = settings.username ? publicPath(settings.username) : null
  return (
    <div className="grid gap-4">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.enabled}
          disabled={busy}
          onChange={(e) => onChange(e.target.checked, settings.sections)}
          className="w-5 h-5 shrink-0"
        />
        <span>開啟公開頁</span>
      </label>
      {settings.enabled && (
        <>
          {path ? (
            <p className="text-sm break-all">
              公開網址：
              <a href={path} target="_blank" rel="noreferrer" className="underline">
                {origin}
                {path}
              </a>
            </p>
          ) : (
            <p className={mutedClass}>代號暫時無法載入，公開網址暫時不顯示。</p>
          )}
          <fieldset className="grid gap-2 min-w-0">
            <legend className={`${mutedClass} mb-1`}>公開哪些內容（勾選後立即生效）</legend>
            {SECTION_OPTIONS.map((o) => (
              <label key={o.key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.sections.includes(o.key)}
                  disabled={busy}
                  onChange={(e) => onChange(settings.enabled, toggleSection(settings.sections, o.key, e.target.checked))}
                  className="w-5 h-5 shrink-0 mt-0.5"
                />
                <span className="min-w-0">{o.label}</span>
              </label>
            ))}
          </fieldset>
          <p className={mutedClass}>警告、雲端資料夾共用與 NetBird 不會公開。</p>
        </>
      )}
      {error && (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      )}
    </div>
  )
}

/** 公開頁區塊；沒有析域帳號時鎖住 */
export function PublicSettingsSection({ overview }: { overview: PersonalOverview }) {
  const locked = isLocked(overview)
  const fetcher = useCallback(
    (signal: AbortSignal) =>
      locked ? Promise.resolve<PublicSettings>({ available: false }) : dashboardFetch<PublicSettings>("/dashboard/personal/public", {}, { signal }),
    [locked],
  )
  const { data, failed, setData } = useLoad(fetcher)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin)
  }, [])

  if (locked) return <PersonalSection title="公開頁" locked />
  if (failed) {
    return (
      <PersonalSection title="公開頁">
        <p className={mutedClass}>暫時無法載入，請稍後重新整理頁面再試。</p>
      </PersonalSection>
    )
  }
  if (!data || !data.available) return null

  const change = async (enabled: boolean, sections: SectionKey[]) => {
    setBusy(true)
    setError(null)
    try {
      setData(await saveSettings(enabled, sections))
    } catch {
      setError("操作失敗，原本的設定沒有改變，請稍後再試。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PersonalSection title="公開頁">
      <PublicSettingsView settings={data} origin={origin} busy={busy} error={error} onChange={(e, s) => void change(e, s)} />
    </PersonalSection>
  )
}
