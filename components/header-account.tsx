"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { API_BASE } from "@/lib/dashboard-api"

interface Me {
  name: string
  avatar_url: string
}

const LINK_CLASS =
  "text-xs sm:text-sm tracking-[0.2em] uppercase text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"

/** 讀登入狀態；任何失敗（含 session_expired、連不上）都當成未登入，不導向也不提示 */
export async function loadMe(signal: AbortSignal): Promise<Me | null> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/me`, { credentials: "include", signal })
    if (!res.ok) return null
    const me: unknown = await res.json()
    if (me && typeof me === "object" && "avatar_url" in me && "name" in me) return me as Me
    return null
  } catch {
    return null
  }
}

/** 官網 header 的登入狀態：未登入顯示「登入」，登入後顯示頭像，點下進入個人區 */
export function HeaderAccount() {
  // undefined：還在確認，先保留位置不顯示，避免「登入」閃一下又換成頭像
  const [me, setMe] = useState<Me | null | undefined>(undefined)

  useEffect(() => {
    const controller = new AbortController()
    loadMe(controller.signal).then((result) => {
      if (!controller.signal.aborted) setMe(result)
    })
    return () => controller.abort()
  }, [])

  if (me === undefined) return <span aria-hidden className="inline-block w-8 h-8" />
  if (me === null) {
    return (
      <Link className={LINK_CLASS} href="/dashboard-login">
        登入
      </Link>
    )
  }
  return (
    <Link href="/dashboard" aria-label={`${me.name} 的個人區`} className="shrink-0 hover:opacity-80 transition-opacity">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={me.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full" />
    </Link>
  )
}
