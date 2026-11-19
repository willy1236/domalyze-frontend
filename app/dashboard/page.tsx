"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AccountSection } from "@/components/dashboard/personal/account"
import { AssetsSection } from "@/components/dashboard/personal/assets"
import { ChannelsSection } from "@/components/dashboard/personal/channels"
import { DriveSection } from "@/components/dashboard/personal/drive"
import { NetbirdSection } from "@/components/dashboard/personal/netbird"
import { PlaylistsSection } from "@/components/dashboard/personal/playlists"
import { PublicSettingsSection } from "@/components/dashboard/personal/public-settings"
import { RecordsSection } from "@/components/dashboard/personal/records"
import { dashboardFetch } from "@/lib/dashboard-api"
import { type PersonalOverview, guildListRedirect, hasDiscord } from "@/lib/dashboard-personal"
import { useDashboardUser } from "@/lib/dashboard-user"
import { useLoad } from "@/lib/use-load"

export default function PersonalPage() {
  const router = useRouter()
  // Twitch 登入沒有個人區，直接到頻道
  const twitchLogin = useDashboardUser()?.login_method === "twitch"
  // 舊網址 /dashboard?notice= 是伺服器清單的通知，轉過去並保留參數
  const [redirecting, setRedirecting] = useState(false)
  useEffect(() => {
    const target = twitchLogin ? "/dashboard/channels" : guildListRedirect(window.location.search)
    if (target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRedirecting(true)
      router.replace(target)
    }
  }, [router, twitchLogin])

  const fetcher = useCallback(
    (signal: AbortSignal) => dashboardFetch<PersonalOverview>("/dashboard/personal/overview", {}, { signal }),
    [],
  )
  const { data: overview, failed } = useLoad(redirecting || twitchLogin ? null : fetcher)

  if (redirecting || twitchLogin) return null

  return (
    <div className="grid gap-10">
      {failed && (
        <>
          <h1 className="text-2xl font-serif">我的</h1>
          <p className="text-gray-500 dark:text-gray-400">無法載入個人資料，請稍後重新整理頁面再試。</p>
        </>
      )}
      {overview && (
        <>
          <AccountSection overview={overview} />
          <ChannelsSection overview={overview} />
          {/* 沒有 Discord 身分（只連結 Twitch 的析域帳號）時，以下 Discord 相關的區塊都不顯示 */}
          {hasDiscord(overview) && (
            <>
              <AssetsSection overview={overview} />
              {/* 主欄放瀏覽與編輯為主的紀錄、歌單；側欄放設定型的工具與公開頁 */}
              <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12 items-start empty:hidden">
                <div className="grid gap-10 min-w-0 empty:hidden">
                  <RecordsSection overview={overview} />
                  <PlaylistsSection overview={overview} />
                </div>
                <aside className="grid gap-10 min-w-0 empty:hidden">
                  <DriveSection overview={overview} />
                  <NetbirdSection overview={overview} />
                  <PublicSettingsSection overview={overview} />
                </aside>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
