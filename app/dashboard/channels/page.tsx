"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LinkButton } from "@/components/ui"
import {
  CHANNEL_LIST_NOTICES,
  type ChannelInfo,
  type ChannelListNotice,
  channelListView,
  channelPath,
  fetchChannels,
  parseChannelListNotice,
} from "@/lib/dashboard-channel"
import { DOMALYZE_ACCOUNT_URL, providerLoginUrl } from "@/lib/dashboard-login"
import { useDashboardUser } from "@/lib/dashboard-user"
import { useLoad } from "@/lib/use-load"

function ChannelRow({ channel }: { channel: ChannelInfo }) {
  return (
    <li>
      <Link
        href={channelPath(channel.id)}
        className="flex items-center gap-3 border border-champagne/30 px-4 py-3 hover:border-champagne transition-colors"
      >
        {channel.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full shrink-0" />
        ) : (
          <span
            aria-hidden
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-champagne/20 text-champagne font-serif"
          >
            {Array.from(channel.name)[0] ?? "?"}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{channel.name}</span>
        <span className="text-xs tracking-widest uppercase text-champagne shrink-0">管理</span>
      </Link>
    </li>
  )
}

export default function ChannelListPage() {
  const router = useRouter()
  // 登入入口要帶前端的 origin；等 hydration 後才有，之前按鈕沒有連結
  const [origin, setOrigin] = useState<string | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin)
  }, [])

  // 被導回來的提示：讀完從網址移除，重新整理時不再顯示
  const [notice, setNotice] = useState<ChannelListNotice | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has("notice")) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotice(parseChannelListNotice(params.get("notice")))
    params.delete("notice")
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`)
  }, [])

  const domalyzeLogin = useDashboardUser()?.login_method === "domalyze"
  const { data, failed } = useLoad(fetchChannels)
  const view = data === null ? null : channelListView(data.channels, notice !== null)

  useEffect(() => {
    if (view?.kind === "redirect") router.replace(channelPath(view.channelId))
  }, [view, router])

  return (
    <section>
      <h1 className="text-2xl font-serif mb-6">頻道</h1>

      {notice && (
        <p role="status" className="mb-4 border border-champagne/30 px-4 py-3">
          {CHANNEL_LIST_NOTICES[notice]}
        </p>
      )}

      {failed && <p className="text-gray-500 dark:text-gray-400">無法載入頻道清單，請稍後重新整理頁面再試。</p>}

      {view?.kind === "list" && data && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.channels.map((c) => (
            <ChannelRow key={c.id} channel={c} />
          ))}
        </ul>
      )}

      {view?.kind === "empty" && domalyzeLogin && (
        <div className="border border-champagne/30 px-4 py-8 text-center">
          <p className="mb-2">還沒有頻道</p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">這個析域帳號還沒有連結 Twitch。連結後約 1 分鐘內會出現在這裡。</p>
          <LinkButton variant="outline" href={DOMALYZE_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
            前往析域帳號頁
          </LinkButton>
        </div>
      )}

      {view?.kind === "empty" && !domalyzeLogin && (
        <div className="border border-champagne/30 px-4 py-8 text-center">
          <p className="mb-2">還沒有頻道</p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            用 Twitch 登入就能管理自己的頻道。改用 Twitch 登入會登出目前的帳號。
          </p>
          <LinkButton
            variant="outline"
            href={origin === null ? undefined : providerLoginUrl("twitch", "/dashboard/channels", origin)}
          >
            以 Twitch 登入
          </LinkButton>
        </div>
      )}
    </section>
  )
}
