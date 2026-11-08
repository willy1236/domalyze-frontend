"use client"

import { useState } from "react"
import { LAST_USER_KEY, dashboardFetch, discardDrafts } from "@/lib/dashboard-api"

export interface DashboardUser {
  id: string
  name: string
  avatar_url: string
}

export function DashboardHeader({ user }: { user: DashboardUser }) {
  const [busy, setBusy] = useState(false)

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
          <span className="text-champagne">✦</span> Xingyu
        </a>
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar_url}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full shrink-0"
          />
          <span className="text-sm truncate max-w-32 sm:max-w-64">{user.name}</span>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="shrink-0 border border-champagne/40 text-champagne px-3 py-1.5 text-xs tracking-widest uppercase hover:bg-champagne hover:text-background-dark transition-colors disabled:opacity-50"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  )
}
