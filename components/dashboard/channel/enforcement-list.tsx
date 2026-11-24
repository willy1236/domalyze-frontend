"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  ENFORCEMENT_PAGE_SIZE,
  type EnforcementEntry,
  type EnforcementOp,
  canLift,
  fetchChannelEnforcement,
  runEnforcementOp,
} from "@/lib/dashboard-enforcement"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"
import { EnforcementEntryView } from "./enforcement-entry"

interface Props {
  channelId: string
  readOnly: boolean
  onNotEnabled: () => void
}

/** 頻道的執法紀錄與誤判處置：解除處罰、清除犯規次數、加入常客。 */
export function EnforcementList({ channelId, readOnly, onNotEnabled }: Props) {
  const [offset, setOffset] = useState(0)
  const handleChannelError = useChannelError()
  const fetcher = useCallback((signal: AbortSignal) => fetchChannelEnforcement(channelId, offset, signal), [channelId, offset])
  const { data, failed, reload } = useLoad(fetcher, { keepPrevious: true, onError: handleChannelError })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [lifted, setLifted] = useState<ReadonlySet<number>>(new Set())

  async function run(entry: EnforcementEntry, op: EnforcementOp) {
    if (busy) return
    setBusy(true)
    setNotice("")
    try {
      const reply = await runEnforcementOp(channelId, entry.id, op)
      if (op === "lift") {
        if (reply?.result === "not_punished") {
          setNotice("這位觀眾已不在處罰中。")
        } else {
          setLifted((current) => new Set(current).add(entry.id))
        }
      } else if (op === "clear-strikes") {
        setNotice(`已清除 ${entry.user_name} 的犯規次數。`)
      } else {
        setNotice(`已把 ${entry.user_name} 加入常客。`)
      }
    } catch (error) {
      if (handleChannelError(error)) return
      if (error instanceof DashboardApiError) {
        if (error.handled) return
        switch (error.code) {
          case "channel_not_enabled":
            onNotEnabled()
            return
          case "already_regular":
            setNotice("這位觀眾已是常客。")
            return
          case "bot_not_mod":
            setNotice("星羽不是這個頻道的 mod，無法解除處罰。")
            return
          case "bot_offline":
            setNotice("星羽目前離線，操作失敗，請稍後再試。")
            return
        }
      }
      setNotice("操作失敗，請稍後再試。")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {readOnly && (
        <p className="mb-4 border border-champagne/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          星羽啟用後才能處理誤判。
        </p>
      )}
      {notice && (
        <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">
          {notice}
        </p>
      )}
      {failed ? (
        <div className="border border-champagne/30 px-4 py-6 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入執法紀錄。</p>
          <Button type="button" onClick={() => void reload()}>
            重新載入
          </Button>
        </div>
      ) : data === null ? (
        <div className="min-h-24" aria-busy="true" />
      ) : data.entries.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">最近 30 天沒有執法紀錄</p>
      ) : (
        <ul className="space-y-3">
          {data.entries.map((entry) => {
            const isLifted = entry.lifted_at !== null || lifted.has(entry.id)
            return (
              <EnforcementEntryView key={entry.id} entry={isLifted ? { ...entry, lifted_at: entry.lifted_at ?? "lifted" } : entry}>
                {!readOnly && (
                  <div className="flex flex-wrap gap-2">
                    {canLift(entry) && !isLifted && (
                      <Button type="button" size="sm" disabled={busy} onClick={() => void run(entry, "lift")}>
                        解除處罰
                      </Button>
                    )}
                    <Button type="button" size="sm" disabled={busy} onClick={() => void run(entry, "clear-strikes")}>
                      清除犯規次數
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={() => void run(entry, "regular")}>
                      加入常客
                    </Button>
                  </div>
                )}
              </EnforcementEntryView>
            )
          })}
        </ul>
      )}
      {data !== null && (offset > 0 || data.has_next) && (
        <nav aria-label="分頁" className="mt-4 flex items-center gap-3">
          <Button type="button" size="sm" disabled={offset <= 0} onClick={() => setOffset(Math.max(0, offset - ENFORCEMENT_PAGE_SIZE))}>
            上一頁
          </Button>
          <span className="text-sm tabular-nums">第 {offset / ENFORCEMENT_PAGE_SIZE + 1} 頁</span>
          <Button type="button" size="sm" disabled={!data.has_next} onClick={() => setOffset(offset + ENFORCEMENT_PAGE_SIZE)}>
            下一頁
          </Button>
        </nav>
      )}
    </>
  )
}
