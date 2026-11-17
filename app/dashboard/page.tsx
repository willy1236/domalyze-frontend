"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AccountSection } from "@/components/dashboard/personal/account"
import { AssetsSection } from "@/components/dashboard/personal/assets"
import { DriveSection } from "@/components/dashboard/personal/drive"
import { NetbirdSection } from "@/components/dashboard/personal/netbird"
import { PlaylistsSection } from "@/components/dashboard/personal/playlists"
import { PublicSettingsSection } from "@/components/dashboard/personal/public-settings"
import { RecordsSection } from "@/components/dashboard/personal/records"
import { dashboardFetch } from "@/lib/dashboard-api"
import { type PersonalOverview, guildListRedirect } from "@/lib/dashboard-personal"
import { useLoad } from "@/lib/use-load"

export default function PersonalPage() {
  const router = useRouter()
  // 舊網址 /dashboard?notice= 是伺服器清單的通知，轉過去並保留參數
  const [redirecting, setRedirecting] = useState(false)
  useEffect(() => {
    const target = guildListRedirect(window.location.search)
    if (target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRedirecting(true)
      router.replace(target)
    }
  }, [router])

  const fetcher = useCallback(
    (signal: AbortSignal) => dashboardFetch<PersonalOverview>("/dashboard/personal/overview", {}, { signal }),
    [],
  )
  const { data: overview, failed } = useLoad(redirecting ? null : fetcher)

  if (redirecting) return null

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-serif">我的</h1>
      {failed && <p className="text-gray-500 dark:text-gray-400">無法載入個人資料，請稍後重新整理頁面再試。</p>}
      {overview && (
        <>
          <AccountSection overview={overview} />
          <AssetsSection overview={overview} />
          <RecordsSection overview={overview} />
          <PlaylistsSection overview={overview} />
          <DriveSection overview={overview} />
          <NetbirdSection overview={overview} />
          <PublicSettingsSection overview={overview} />
        </>
      )}
    </div>
  )
}
