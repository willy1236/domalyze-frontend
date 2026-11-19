"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { LinkButton } from "@/components/ui"
import { API_BASE, dashboardFetch } from "@/lib/dashboard-api"
import { permissionNotice } from "@/lib/dashboard-sections"
import { useLoad } from "@/lib/use-load"

interface GuildItem {
  id: string
  name: string
  icon_url: string | null
}

interface GuildList {
  guilds: GuildItem[]
}

const NOTICES: Record<string, string> = {
  need_permissions: permissionNotice(),
  invite_pending: "星羽已加入伺服器，但清單還沒更新，請稍後重新整理頁面。",
}

/** 邀請入口：整頁導向授權，由使用者在 Discord 頁面選擇伺服器，完成後回到後台。 */
function inviteUrl(): string {
  const params = new URLSearchParams({ origin: window.location.origin })
  return `${API_BASE}/to/discordbot?${params.toString()}`
}

function GuildIcon({ guild }: { guild: GuildItem }) {
  if (guild.icon_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={guild.icon_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full shrink-0" />
  }
  return (
    <span
      aria-hidden
      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-champagne/20 text-champagne font-serif"
    >
      {Array.from(guild.name)[0] ?? "?"}
    </span>
  )
}

function GuildRow({ guild }: { guild: GuildItem }) {
  return (
    <li>
      <Link
        href={`/dashboard/guilds/${guild.id}`}
        className="flex items-center gap-3 border border-champagne/30 px-4 py-3 hover:border-champagne transition-colors"
      >
        <GuildIcon guild={guild} />
        <span className="min-w-0 flex-1 truncate">{guild.name}</span>
        <span className="text-xs tracking-widest uppercase text-champagne shrink-0">管理</span>
      </Link>
    </li>
  )
}

export default function GuildListPage() {
  const [notice, setNotice] = useState<string | null>(null)

  // 邀請完成後帶 ?notice=，顯示一次後從網址移除
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("notice")
    // 網址參數只在瀏覽器讀得到，要等 hydration 之後才能設定，否則伺服器與瀏覽器的初次 render 不一致
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (key && NOTICES[key]) setNotice(NOTICES[key])
    if (key) {
      params.delete("notice")
      const query = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""))
    }
  }, [])

  const fetcher = useCallback(
    (signal: AbortSignal) => dashboardFetch<GuildList>("/dashboard/guilds", {}, { signal }),
    [],
  )
  const { data: list, failed } = useLoad(fetcher)

  const isEmpty = list !== null && list.guilds.length === 0

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-serif">Discord 伺服器</h1>
        {list && !isEmpty && (
          <LinkButton variant="outline" href={inviteUrl()}>
            邀請星羽
          </LinkButton>
        )}
      </div>

      {notice && (
        <p role="status" className="border border-champagne/30 px-4 py-3 mb-6">
          {notice}
        </p>
      )}

      {failed && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">無法載入伺服器清單，請稍後重新整理頁面再試。</p>
      )}

      {list && !failed && list.guilds.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.guilds.map((g) => (
            <GuildRow key={g.id} guild={g} />
          ))}
        </ul>
      )}

      {isEmpty && !failed && (
        <div className="border border-champagne/30 px-4 py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            沒有可管理的伺服器。星羽要先加入伺服器，你也需要該伺服器的管理權限；邀請星羽需要「管理伺服器」權限。
          </p>
          <LinkButton variant="outline" href={inviteUrl()}>
            邀請星羽
          </LinkButton>
        </div>
      )}
    </section>
  )
}
