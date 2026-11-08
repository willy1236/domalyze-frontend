"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DashboardHeader, type DashboardUser } from "@/components/dashboard/dashboard-header"
import { LAST_USER_KEY, dashboardFetch, discardDrafts, setDashboardUserId } from "@/lib/dashboard-api"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<DashboardUser | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    dashboardFetch<DashboardUser>("/dashboard/me", {}, { signal: controller.signal, silentSessionExpired: true })
      .then((me) => {
        setDashboardUserId(me.id)
        let switched = false
        try {
          const last = sessionStorage.getItem(LAST_USER_KEY)
          sessionStorage.removeItem(LAST_USER_KEY)
          if (last && last !== me.id) {
            discardDrafts()
            switched = true
          }
        } catch {
          // sessionStorage 不可用時略過換帳號偵測
        }
        setUser(me)
        if (switched && pathname !== "/dashboard") router.replace("/dashboard")
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load /dashboard/me failed", e)
      })
    return () => controller.abort()
    // 只在掛載時載入一次；pathname 變動不重新驗證
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    return <div className="min-h-screen" aria-busy="true" />
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">{children}</main>
    </div>
  )
}
