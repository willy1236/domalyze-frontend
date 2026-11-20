"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui"
import {
  HEALTH_CONCURRENCY,
  TOKEN_PROBLEMS,
  TOKEN_PROBLEM_LABELS,
  type TokenProblem,
  createLimiter,
  fetchOpsChannels,
  isNotBotOwner,
  parseTokenProblemFilter,
  totalPages,
  withTokenProblemFilter,
} from "@/lib/dashboard-ops"
import { useLoad } from "@/lib/use-load"
import { OpsChannelRow } from "./ops-channel-row"
import { OpsForbidden } from "./ops-forbidden"

/** 「只看 token 有問題」存在網址；hydration 後才讀得到，之前是 null，清單先不載入 */
function useTokenProblemFilter(): [boolean | null, (on: boolean) => void] {
  const [filter, setFilter] = useState<boolean | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilter(parseTokenProblemFilter(window.location.search))
  }, [])
  const update = useCallback((on: boolean) => {
    setFilter(on)
    window.history.replaceState(null, "", `${window.location.pathname}${withTokenProblemFilter(window.location.search, on)}`)
  }, [])
  return [filter, update]
}

function TokenProblemSummary({ problems, enabledCount }: { problems: Record<TokenProblem, number>; enabledCount: number }) {
  const total = TOKEN_PROBLEMS.reduce((sum, key) => sum + problems[key], 0)
  if (enabledCount === 0) return <p className="text-sm text-gray-600 dark:text-gray-400">沒有已啟用的頻道</p>
  if (total === 0) return <p className="text-sm text-gray-600 dark:text-gray-400">已啟用的頻道 token 都正常</p>
  return (
    <p className="text-sm">
      token 有問題 {total} 個：
      {TOKEN_PROBLEMS.filter((key) => problems[key] > 0)
        .map((key) => `${TOKEN_PROBLEM_LABELS[key]} ${problems[key]}`)
        .join("・")}
    </p>
  )
}

/**
 * 營運入口的頻道清單：只載入 DB 狀態，已啟用的頻道再逐列補查權限問題（同時最多 HEALTH_CONCURRENCY 個）。
 * 上方是所有已啟用頻道的 token 問題統計，可以只看 token 有問題的頻道。
 */
export function OpsChannelList() {
  const [page, setPage] = useState(1)
  const [tokenProblem, setTokenProblem] = useTokenProblemFilter()
  const fetcher = useCallback(
    (signal: AbortSignal) => fetchOpsChannels(page, tokenProblem ?? false, signal),
    [page, tokenProblem],
  )
  const { data, error, failed, reload } = useLoad(tokenProblem === null ? null : fetcher, { keepPrevious: true })
  // 整個清單共用同一個限流器：翻頁時前一頁的列卸載會中止它們排隊中的請求
  const [limiter] = useState(() => createLimiter(HEALTH_CONCURRENCY))

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (failed) return <p className="text-gray-500 dark:text-gray-400">無法載入頻道清單，請稍後重新整理頁面再試。</p>
  if (data === null) return <p className="text-gray-500 dark:text-gray-400">載入中…</p>

  const pages = totalPages(data.total, data.page_size)
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <TokenProblemSummary problems={data.token_problems} enabledCount={data.enabled_count} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={tokenProblem ?? false}
            onChange={(e) => {
              setTokenProblem(e.target.checked)
              setPage(1)
            }}
          />
          只看 token 有問題
        </label>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">共 {data.total} 個頻道</p>
      {data.channels.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-8 text-center">
          {tokenProblem ? "沒有 token 有問題的頻道" : "還沒有頻道"}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.channels.map((channel) => (
            <OpsChannelRow key={channel.id} channel={channel} limiter={limiter} onChanged={reload} />
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="分頁" className="flex items-center gap-3">
          <Button type="button" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            上一頁
          </Button>
          <span className="text-sm tabular-nums">
            {page}／{pages}
          </span>
          <Button type="button" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            下一頁
          </Button>
        </nav>
      )}
    </div>
  )
}
