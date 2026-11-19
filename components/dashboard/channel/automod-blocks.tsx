"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui"
import {
  type AutomodBlock,
  blockReasonLabel,
  blockSourceLabel,
  fetchAutomodBlocks,
} from "@/lib/dashboard-channel-automod"
import { formatDateTime } from "@/lib/dashboard-giveaways"
import { useLoad } from "@/lib/use-load"

/** 擋下紀錄的清單；沒有紀錄時顯示空狀態。 */
export function AutomodBlockList({ blocks }: { blocks: AutomodBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">最近沒有被擋下的訊息。</p>
  }
  return (
    <ul className="divide-y divide-champagne/20 border border-champagne/30">
      {blocks.map((block) => (
        <li key={block.id} className="px-4 py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={block.at}>{formatDateTime(block.at)}</time>
            {" · "}
            {blockSourceLabel(block)}
            {" · "}
            {blockReasonLabel(block.reason)}
          </p>
          <p className="mt-1 break-words">{block.text}</p>
        </li>
      ))}
    </ul>
  )
}

/** 頻道總覽的「最近被擋下的訊息」：星羽發言前被頻道 AutoMod 擋下的最近 20 則。 */
export function AutomodBlocks({ channelId }: { channelId: string }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchAutomodBlocks(channelId, signal), [channelId])
  const { data, error, reload } = useLoad(fetcher)
  return (
    <section className="mt-8">
      <h3 className="text-xl font-serif mb-2">最近被擋下的訊息</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        星羽發言前會用頻道的 AutoMod 設定檢查帶有觀眾輸入的訊息，沒通過的不會送出，列在這裡，最多 20 則。
      </p>
      {error ? (
        <div className="border border-champagne/30 px-4 py-6 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入，請稍後再試。</p>
          <Button type="button" onClick={() => void reload()}>
            重新載入
          </Button>
        </div>
      ) : data === null ? (
        <div className="min-h-24" aria-busy="true" />
      ) : (
        <AutomodBlockList blocks={data.blocks} />
      )}
    </section>
  )
}
