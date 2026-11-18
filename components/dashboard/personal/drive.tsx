"use client"

import { useCallback, useState } from "react"
import { dashboardFetch } from "@/lib/dashboard-api"
import { type DriveState, failureText, gmailHint, normalizeGmail } from "@/lib/dashboard-drive"
import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { useLoad } from "@/lib/use-load"
import { PersonalSection } from "./personal-section"

const buttonClass =
  "border border-primary/30 dark:border-champagne/30 text-primary dark:text-silver px-3 py-1.5 text-xs tracking-widest uppercase hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-colors disabled:opacity-60 disabled:hover:bg-transparent disabled:cursor-not-allowed"
const mutedClass = "text-sm text-gray-500 dark:text-gray-400"
const errorClass = "text-sm text-red-700 dark:text-red-300"

/** 雲端資料夾區塊的內容：目前共用的 gmail 與設定表單；資料與動作由外層提供 */
export function DriveView({
  state,
  busy,
  error,
  onSave,
  onRemove,
}: {
  state: DriveState
  busy: boolean
  error: string | null
  onSave: (gmail: string) => void
  onRemove: () => void
}) {
  const [input, setInput] = useState("")
  const hint = gmailHint(input)
  const normalized = normalizeGmail(input)

  return (
    <div className="grid gap-4">
      {state.unavailable ? (
        <p className={mutedClass}>暫時無法載入。</p>
      ) : (
        <p className="break-all">
          {state.gmail ? (
            <>
              目前共用給 <span className="font-serif">{state.gmail}</span>
            </>
          ) : (
            <span className={mutedClass}>尚未共用雲端資料夾。</span>
          )}
        </p>
      )}
      {state.writable && (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (normalized) onSave(normalized)
          }}
        >
          <label className="grid gap-1 text-sm">
            <span>{state.gmail ? "更換 Gmail" : "共用給 Gmail"}</span>
            <input
              type="text"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="帳號或 xxx@gmail.com"
              aria-invalid={hint !== null}
              className="w-full min-w-0 border border-champagne/40 bg-transparent px-3 py-2"
            />
          </label>
          {hint && (
            <p role="alert" className={errorClass}>
              {hint}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonClass} disabled={busy || normalized === null}>
              {busy ? "處理中…" : state.gmail ? "更換" : "設定"}
            </button>
            {state.gmail && (
              <button type="button" className={buttonClass} disabled={busy} onClick={onRemove}>
                取消共用
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className={errorClass}>
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}

/** 雲端資料夾共用區塊；可見的 Discord 都不在開放此功能的伺服器時不顯示，沒有析域帳號時唯讀 */
export function DriveSection({ overview }: { overview: PersonalOverview }) {
  const fetcher = useCallback((signal: AbortSignal) => dashboardFetch<DriveState>("/dashboard/personal/drive", {}, { signal }), [])
  const { data, failed, setData } = useLoad(fetcher)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (init: { method: string; json?: unknown }) => {
    setBusy(true)
    setError(null)
    try {
      setData(await dashboardFetch<DriveState>("/dashboard/personal/drive", init))
    } catch (e) {
      setError(failureText(e))
    } finally {
      setBusy(false)
    }
  }

  if (failed) {
    return (
      <PersonalSection title="雲端資料夾共用" locked={isLocked(overview)}>
        <p className={mutedClass}>暫時無法載入，請稍後重新整理頁面再試。</p>
      </PersonalSection>
    )
  }
  if (!data || !data.eligible) return null
  return (
    <PersonalSection title="雲端資料夾共用" locked={isLocked(overview)}>
      <DriveView
        state={data}
        busy={busy}
        error={error}
        onSave={(gmail) => void run({ method: "PUT", json: { gmail } })}
        onRemove={() => void run({ method: "DELETE" })}
      />
    </PersonalSection>
  )
}
