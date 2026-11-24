"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Button, Input, LinkButton } from "@/components/ui"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { enableUrl, type ChannelRole } from "@/lib/dashboard-channel"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"

interface StreamInfo {
  title: string
  category_id: string
  category_name: string
  is_live: boolean
  started_at: string | null
  can_edit: boolean
}

interface Category {
  id: string
  name: string
}

const TITLE_MAX = 140

function uptime(startedAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60_000))
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours} 小時 ${minutes % 60} 分` : `${minutes} 分`
}

/** 實況資訊：顯示目前標題、分類與開台狀態；有改標題權限時可修改標題並搜尋選擇分類。 */
export function StreamInfoForm({ channelId, role, readOnly }: { channelId: string; role: ChannelRole; readOnly: boolean }) {
  const path = `/dashboard/channels/${encodeURIComponent(channelId)}/stream-info`
  const handleChannelError = useChannelError()
  const fetcher = useCallback((signal: AbortSignal) => dashboardFetch<StreamInfo>(path, {}, { signal }), [path])
  const { data, error, failed, reload } = useLoad(fetcher, { onError: handleChannelError })
  const [title, setTitle] = useState("")
  const [chosen, setChosen] = useState<Category | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Category[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [origin, setOrigin] = useState<string | null>(null)
  const searchSeq = useRef(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin)
  }, [])
  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(data.title)
      setChosen(null)
    }
  }, [data])

  const editable = data?.can_edit === true && !readOnly
  const editedTitle = data && title.trim() !== data.title ? title.trim() : undefined
  const editedCategory = chosen && chosen.id !== data?.category_id ? chosen.id : undefined
  const scopeMissing = error instanceof DashboardApiError && error.code === "scope_missing"
  const reauthorize = role === "owner" && (
    <LinkButton variant="outline" href={origin === null ? undefined : enableUrl(channelId, origin)}>
      重新授權
    </LinkButton>
  )

  async function search(value: string) {
    setQuery(value)
    const seq = ++searchSeq.current
    if (!value.trim()) {
      setResults([])
      return
    }
    try {
      const found = await dashboardFetch<{ categories: Category[] }>(`${path}/categories?q=${encodeURIComponent(value.trim())}`)
      if (seq === searchSeq.current) setResults(found.categories)
    } catch (caught) {
      if (handleChannelError(caught)) return
      if (seq === searchSeq.current) setResults([])
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !editable || editedTitle === "" || (editedTitle === undefined && editedCategory === undefined)) return
    setBusy(true)
    setNotice("")
    try {
      await dashboardFetch(path, { method: "PUT", json: { title: editedTitle, category_id: editedCategory } })
      setQuery("")
      setResults([])
      await reload()
      setNotice("已儲存。")
    } catch (caught) {
      if (handleChannelError(caught)) return
      if (caught instanceof DashboardApiError) {
        if (caught.handled) return
        if (caught.code === "scope_missing") {
          void reload()
          return
        }
        if (caught.code === "twitch_failed") {
          setNotice("Twitch 沒有成功處理，請稍後再試。")
          return
        }
      }
      setNotice("儲存失敗，請稍後再試。")
    } finally {
      setBusy(false)
    }
  }

  if (failed) {
    return (
      <div className="border border-champagne/30 px-4 py-6">
        {scopeMissing ? (
          <>
            <p className="mb-4" role="alert">需要實況主重新授權才能讀取實況資訊。</p>
            {reauthorize}
          </>
        ) : (
          <>
            <p className="mb-4" role="alert">目前無法讀取實況資訊。</p>
            <Button type="button" onClick={() => void reload()}>重試</Button>
          </>
        )}
      </div>
    )
  }
  if (data === null) return <p aria-busy="true" role="status">載入中…</p>

  return (
    <form onSubmit={save} className="flex max-w-2xl flex-col gap-5">
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline text-gray-600 dark:text-gray-400">目前標題：</dt>
          <dd className="inline break-all">{data.title}</dd>
        </div>
        <div>
          <dt className="inline text-gray-600 dark:text-gray-400">目前分類：</dt>
          <dd className="inline">{data.category_name}</dd>
        </div>
      </dl>
      <p>
        {data.is_live && data.started_at ? `直播中，已開台 ${uptime(data.started_at)}` : "未開台"}
      </p>
      {!data.can_edit && (
        <div role="status" className="border border-champagne/30 px-4 py-3 text-sm space-y-3">
          <p>需要實況主重新授權（啟用 bot）才能修改標題與分類。</p>
          {reauthorize}
        </div>
      )}
      <label className="flex flex-col gap-1 text-sm">
        標題
        <Input
          type="text"
          aria-label="標題"
          value={title}
          maxLength={TITLE_MAX}
          disabled={!editable || busy}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <span>{chosen ? `改成分類：${chosen.name}（待儲存）` : "更換分類"}</span>
        <Input
          type="text"
          aria-label="搜尋分類"
          placeholder="搜尋分類"
          value={query}
          autoComplete="off"
          disabled={!editable || busy}
          onChange={(event) => void search(event.target.value)}
        />
        {results.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {results.map((category) => (
              <Button
                key={category.id}
                type="button"
                onClick={() => {
                  setChosen(category)
                  setQuery("")
                  setResults([])
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}
      </div>
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {editable && <Button type="submit" disabled={busy || editedTitle === ""}>儲存</Button>}
    </form>
  )
}
