"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { dashboardFetch } from "@/lib/dashboard-api"

interface GuildItem {
  id: string
  name: string
  icon_url: string | null
}

interface GuildLists {
  invited: GuildItem[]
  not_invited: GuildItem[]
}

const INVITE_URL = process.env.NEXT_PUBLIC_BOT_INVITE_URL || ""

const buttonClass =
  "border border-champagne/40 text-champagne px-4 py-2 text-xs tracking-widest uppercase hover:bg-champagne hover:text-background-dark transition-colors disabled:opacity-50 disabled:pointer-events-none"

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

function GuildRow({ guild, invited }: { guild: GuildItem; invited: boolean }) {
  const content = (
    <>
      <GuildIcon guild={guild} />
      <span className="min-w-0 flex-1 truncate">{guild.name}</span>
      <span className="text-xs tracking-widest uppercase text-champagne shrink-0">{invited ? "管理" : "邀請"}</span>
    </>
  )
  const className =
    "flex items-center gap-3 border border-champagne/30 px-4 py-3 hover:border-champagne transition-colors"
  return (
    <li>
      {invited ? (
        <Link href={`/dashboard/guilds/${guild.id}`} className={className}>
          {content}
        </Link>
      ) : (
        <a href={INVITE_URL} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      )}
    </li>
  )
}

function GuildGroup({ title, guilds, invited }: { title: string; guilds: GuildItem[]; invited: boolean }) {
  if (guilds.length === 0) return null
  return (
    <section className="mb-10">
      <h2 className="text-sm tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
        {title}（{guilds.length}）
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guilds.map((g) => (
          <GuildRow key={g.id} guild={g} invited={invited} />
        ))}
      </ul>
    </section>
  )
}

export default function DashboardPage() {
  const [lists, setLists] = useState<GuildLists | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async (refresh: boolean, signal?: AbortSignal) => {
    setLoading(true)
    setFailed(false)
    try {
      const path = refresh ? "/dashboard/guilds?refresh=1" : "/dashboard/guilds"
      setLists(await dashboardFetch<GuildLists>(path, {}, { signal }))
    } catch (e) {
      if (signal?.aborted) return
      console.error("load /dashboard/guilds failed", e)
      setFailed(true)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(false, controller.signal)
    return () => controller.abort()
  }, [load])

  const isEmpty = lists !== null && lists.invited.length === 0 && lists.not_invited.length === 0

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-serif">伺服器</h1>
        <button type="button" className={buttonClass} disabled={loading} onClick={() => void load(true)}>
          {loading ? "載入中…" : "重新整理"}
        </button>
      </div>

      {failed && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">無法載入伺服器清單，請稍後按「重新整理」再試。</p>
      )}

      {lists && !failed && (
        <>
          <GuildGroup title="已邀請" guilds={lists.invited} invited />
          <GuildGroup title="未邀請" guilds={lists.not_invited} invited={false} />
        </>
      )}

      {isEmpty && !failed && (
        <div className="border border-champagne/30 px-4 py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            沒有可管理的伺服器。管理頻道通知需要「管理頻道」權限，邀請星羽需要「管理伺服器」權限。
          </p>
          {INVITE_URL && (
            <a href={INVITE_URL} target="_blank" rel="noopener noreferrer" className={`${buttonClass} inline-block`}>
              邀請星羽
            </a>
          )}
        </div>
      )}
    </section>
  )
}
