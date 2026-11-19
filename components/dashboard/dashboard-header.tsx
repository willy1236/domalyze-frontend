"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui"
import { UserAvatar } from "@/components/user-avatar"
import { LAST_USER_KEY, dashboardFetch, discardDrafts } from "@/lib/dashboard-api"
import { type DashboardUser, dashboardNav } from "@/lib/dashboard-user"

export type { DashboardUser }

export function DashboardHeader({ user }: { user: DashboardUser }) {
  const [busy, setBusy] = useState(false)
  const pathname = usePathname()

  async function logout() {
    setBusy(true)
    try {
      await dashboardFetch("/dashboard/logout", { method: "POST" }, { sessionExpiredIsOk: true })
      // 登出後可能換帳號登入：丟棄殘留暫存，並記下這個帳號供回來時比對
      discardDrafts()
      try {
        sessionStorage.setItem(LAST_USER_KEY, user.id)
      } catch {
        // sessionStorage 不可用時略過換帳號偵測
      }
      // 整頁重新載入，清掉登入期間留在記憶體的狀態
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/"
    } catch {
      setBusy(false)
      window.alert("登出失敗，請稍後再試。")
    }
  }

  return (
    <header className="w-full border-b border-champagne/30 dark:border-champagne/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between gap-3">
        <a
          href="/dashboard"
          className="text-lg font-serif tracking-widest text-primary uppercase flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/xingyu-mark.svg" alt="" width={28} height={28} className="w-7 h-7 dark:brightness-[1.3]" />
          <span className="hidden sm:inline">Xingyu</span>
        </a>
        <nav className="flex items-center gap-3 sm:gap-6 mr-auto ml-1 sm:ml-6 min-w-0 overflow-x-auto">
          {dashboardNav(user).map((item) => {
            const active = item.active(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-xs sm:text-sm whitespace-nowrap transition-colors ${active ? "text-champagne" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3 min-w-0">
          {/* 360px 寬放不下頭像：導覽項目變長後，手機版只留登出按鈕 */}
          <span className="hidden sm:inline-flex">
            <UserAvatar src={user.avatar_url} name={user.name} />
          </span>
          <span className="hidden sm:inline text-sm truncate max-w-64">{user.name}</span>
          <Button
            type="button"
            size="sm"
            onClick={logout}
            disabled={busy}
            className="shrink-0 disabled:opacity-50"
          >
            登出
          </Button>
        </div>
      </div>
    </header>
  )
}
