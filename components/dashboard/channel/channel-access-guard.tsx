"use client"

import { createContext, useCallback, useContext } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { type ChannelDetail, fetchChannel, isChannelForbidden } from "@/lib/dashboard-channel"
import { useLoad } from "@/lib/use-load"

export type ChannelGuardView = "forbidden" | "failed" | "loading" | "ready"

/** 守衛目前該呈現的狀態；沒有權限優先，其次是載入失敗。 */
export function channelGuardView(data: ChannelDetail | null, error: unknown): ChannelGuardView {
  if (isChannelForbidden(error)) return "forbidden"
  if (error) return "failed"
  return data === null ? "loading" : "ready"
}

const ChannelContext = createContext<ChannelDetail | null>(null)
const ChannelReloadContext = createContext<(() => Promise<void>) | null>(null)

/** 頻道頁底下的元件讀目前頻道的資料；必須在 ChannelAccessGuard 內使用。 */
export function useChannel(): ChannelDetail {
  const channel = useContext(ChannelContext)
  if (!channel) throw new Error("useChannel 必須在 ChannelAccessGuard 內使用")
  return channel
}

/** 重新載入目前頻道的資料（啟用狀態改變後用）；必須在 ChannelAccessGuard 內使用。 */
export function useReloadChannel(): () => Promise<void> {
  const reload = useContext(ChannelReloadContext)
  if (!reload) throw new Error("useReloadChannel 必須在 ChannelAccessGuard 內使用")
  return reload
}

/** 載入頻道資料並擋下沒有權限的人；通過後把頻道資料提供給底下所有頁面。 */
export function ChannelAccessGuard({ channelId, children }: { channelId: string; children: React.ReactNode }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchChannel(channelId, signal), [channelId])
  const { data, error, reload } = useLoad(fetcher)
  const view = channelGuardView(data, error)

  if (view === "forbidden") {
    return (
      <div className="border border-champagne/30 px-4 py-8 text-center">
        <p className="mb-4">沒有這個頻道的權限</p>
        <Link href="/dashboard/channels" className="text-champagne underline underline-offset-4">
          回到頻道清單
        </Link>
      </div>
    )
  }
  if (view === "failed") {
    return (
      <div className="border border-champagne/30 px-4 py-8 text-center">
        <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入頻道資料，請稍後再試。</p>
        <Button type="button" onClick={() => void reload()}>
          重新載入
        </Button>
      </div>
    )
  }
  if (view === "loading" || data === null) return <div className="min-h-[40vh]" aria-busy="true" />
  return (
    <ChannelContext.Provider value={data}>
      <ChannelReloadContext.Provider value={reload}>{children}</ChannelReloadContext.Provider>
    </ChannelContext.Provider>
  )
}
