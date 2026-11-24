"use client"

import { useCallback, useState, type FormEvent } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"

interface Term {
  id: string
  text: string
}

interface Props {
  channelId: string
  readOnly: boolean
}

/** Twitch 原生的 Blocked Terms：詞存在 Twitch，經 Twitch bot 讀寫。 */
export function BlockedTerms({ channelId, readOnly }: Props) {
  const path = `/dashboard/channels/${encodeURIComponent(channelId)}/blocked-terms`
  const handleChannelError = useChannelError()
  const fetcher = useCallback(
    (signal: AbortSignal) => dashboardFetch<{ terms: Term[] }>(path, {}, { signal }),
    [path],
  )
  const { data, error, failed, reload } = useLoad(fetcher, { onError: handleChannelError })
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const notMod = error instanceof DashboardApiError && error.code === "bot_not_mod"

  async function change(termId?: string) {
    if (busy || readOnly || (termId === undefined && text.trim().length < 2)) return
    setBusy(true)
    setNotice("")
    try {
      if (termId === undefined) {
        await dashboardFetch(path, { method: "POST", json: { text: text.trim() } })
        setText("")
      } else {
        await dashboardFetch(`${path}/${encodeURIComponent(termId)}`, { method: "DELETE" })
      }
      await reload()
    } catch (caught) {
      if (handleChannelError(caught)) return
      if (caught instanceof DashboardApiError) {
        if (caught.handled) return
        if (caught.code === "bot_not_mod") {
          void reload()
          return
        }
        if (caught.code === "bot_offline") {
          setNotice("Twitch bot 目前離線，請稍後再試。")
          return
        }
        if (caught.code === "invalid_term") {
          setNotice(typeof caught.body?.reason === "string" ? caught.body.reason : "請檢查這個詞的格式。")
          return
        }
      }
      setNotice("操作失敗，請稍後再試。")
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void change()
  }

  return (
    <section className="border border-champagne/30 px-4 py-4">
      <h3 className="mb-3 text-xl font-serif">Twitch Blocked Terms</h3>
      {notMod ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          星羽還不是這個頻道的 mod，無法管理 Blocked Terms。請先在 Twitch 把星羽設為 mod。
        </p>
      ) : failed ? (
        <div>
          <p className="mb-4" role="alert">目前無法讀取 Blocked Terms。</p>
          <Button type="button" onClick={() => void reload()}>重試</Button>
        </div>
      ) : data === null ? (
        <p aria-busy="true" role="status">載入中…</p>
      ) : (
        <>
          {!readOnly && (
            <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                新增詞
                <input
                  type="text"
                  className="border border-champagne/40 bg-transparent px-3 py-2"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  autoComplete="off"
                  aria-describedby="blocked-term-format"
                  maxLength={500}
                  disabled={busy}
                />
                <span id="blocked-term-format" className="text-xs text-gray-600 dark:text-gray-400">
                  最多 500 字。至少 2 個非空白字元，用 * 時須有至少 3 個，並把 * 放在字詞開頭或結尾。
                </span>
              </label>
              <Button type="submit" disabled={busy || text.trim().length < 2}>新增</Button>
            </form>
          )}
          {notice && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{notice}</p>}
          {data.terms.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">還沒有 Blocked Terms。</p>
          ) : (
            <ul className="divide-y divide-champagne/20 border border-champagne/30">
              {data.terms.map((term) => (
                <li key={term.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="break-all">{term.text}</span>
                  {!readOnly && (
                    <Button type="button" disabled={busy} onClick={() => void change(term.id)}>刪除</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
