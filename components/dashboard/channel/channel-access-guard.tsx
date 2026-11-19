"use client"

import { createContext, useCallback, useContext, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui"
import { type ChannelDetail, channelLeaveTarget, fetchChannel, isChannelForbidden, leaveIfUnlinked } from "@/lib/dashboard-channel"
import { useDashboardUser } from "@/lib/dashboard-user"
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

/**
 * 頻道頁的寫入操作（存檔、開關、刪除）的 catch 先呼叫回傳的函式：
 * 析域登入的頻道被解除連結時回到頻道清單並提示，回傳 true，呼叫端直接結束；回傳 false 就照常處理錯誤。
 * W-05～W-07 的頁面共用。
 */
export function useChannelError(): (error: unknown) => boolean {
  const router = useRouter()
  const loginMethod = useDashboardUser()?.login_method
  return useCallback((error: unknown) => leaveIfUnlinked(error, loginMethod, (url) => router.replace(url)), [loginMethod, router])
}

/** 載入頻道資料並擋下沒有權限的人；通過後把頻道資料提供給底下所有頁面。 */
export function ChannelAccessGuard({ channelId, children }: { channelId: string; children: React.ReactNode }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchChannel(channelId, signal), [channelId])
  const { data, error, reload } = useLoad(fetcher)
  const view = channelGuardView(data, error)

  // 析域登入的頻道被解除連結：回到頻道清單並提示
  const leaveTarget = channelLeaveTarget(error, useDashboardUser()?.login_method)
  const router = useRouter()
  useEffect(() => {
    if (leaveTarget) router.replace(leaveTarget)
  }, [leaveTarget, router])

  // 在頻道內換頁時重新確認權限，解除連結後的下一次操作才會被導走（layout 不會重新掛載）
  const pathname = usePathname()
  const lastPathname = useRef(pathname)
  useEffect(() => {
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    void reload()
  }, [pathname, reload])

  if (leaveTarget) return <div className="min-h-[40vh]" aria-busy="true" />
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
