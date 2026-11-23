"use client"

import { useCallback, useState, type FormEvent } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"

interface Regular {
  user_id: string
  user_login: string
  user_name: string
}

interface Props {
  channelId: string
  readOnly: boolean
  onNotEnabled: () => void
}

export function RegularList({ channelId, readOnly, onNotEnabled }: Props) {
  const path = `/dashboard/channels/${encodeURIComponent(channelId)}/regulars`
  const fetcher = useCallback(
    (signal: AbortSignal) => dashboardFetch<{ regulars: Regular[] }>(path, {}, { signal }),
    [path],
  )
  const handleChannelError = useChannelError()
  const { data, failed, reload } = useLoad(fetcher, { onError: handleChannelError })
  const [login, setLogin] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")

  async function change(userId?: string) {
    if (busy || readOnly || (userId === undefined && !login.trim())) return
    setBusy(true)
    setNotice("")
    try {
      if (userId === undefined) {
        await dashboardFetch(path, { method: "POST", json: { login: login.trim() } })
        setLogin("")
      } else {
        await dashboardFetch(`${path}/${encodeURIComponent(userId)}`, { method: "DELETE" })
      }
      void reload()
    } catch (error) {
      if (handleChannelError(error)) return
      if (error instanceof DashboardApiError) {
        if (error.handled) return
        switch (error.code) {
          case "channel_not_enabled":
            onNotEnabled()
            return
          case "user_not_found":
            setNotice("找不到這個 Twitch 帳號。")
            return
          case "already_regular":
            setNotice("這個帳號已是常客。")
            void reload()
            return
          case "user_lookup_unavailable":
            setNotice("目前無法查詢 Twitch 帳號，請稍後再試。")
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
    <>
      {readOnly ? (
        <p className="mb-4 border border-champagne/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          星羽啟用後才能修改常客名單。
        </p>
      ) : (
        <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Twitch 帳號
            <input
              className="border border-champagne/40 bg-transparent px-3 py-2"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="off"
              maxLength={128}
              required
              disabled={busy}
            />
          </label>
          <Button type="submit" disabled={busy || !login.trim()}>新增常客</Button>
        </form>
      )}
      {notice && <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{notice}</p>}
      {failed ? (
        <div className="border border-champagne/30 px-4 py-6 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入常客名單。</p>
          <Button type="button" onClick={() => void reload()}>重新載入</Button>
        </div>
      ) : data === null ? (
        <div className="min-h-24" aria-busy="true" />
      ) : data.regulars.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">還沒有常客。</p>
      ) : (
        <ul className="divide-y divide-champagne/20 border border-champagne/30">
          {data.regulars.map((regular) => (
            <li key={regular.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{regular.user_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{regular.user_login}</p>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  disabled={busy}
                  aria-label={`移除 ${regular.user_name}`}
                  onClick={() => void change(regular.user_id)}
                >
                  移除
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
