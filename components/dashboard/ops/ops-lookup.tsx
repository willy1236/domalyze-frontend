"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, type ReactNode, useCallback, useState } from "react"
import { Button, Input } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { isNotBotOwner } from "@/lib/dashboard-ops"
import {
  type ChannelMatch,
  type GuildMatch,
  type GuildRef,
  type LookupMatch,
  type MessageMatch,
  type RoleMatch,
  type UserMatch,
  fetchLookup,
  isLookupFailure,
  isValidId,
  lookupFailureText,
  lookupPath,
  memberStatusLabel,
  messageContentText,
} from "@/lib/dashboard-ops-discord"
import { useLoad } from "@/lib/use-load"
import { OpsForbidden } from "./ops-forbidden"

const muted = "text-gray-600 dark:text-gray-400"
const box = "border border-champagne/30 px-4 py-3 min-w-0"
const linkClass = "underline-offset-2 hover:underline hover:text-primary dark:hover:text-champagne"
const fmt = new Intl.NumberFormat("zh-TW")

function formatTime(iso: string | null): string {
  return iso === null ? "不明" : new Date(iso).toLocaleString("zh-TW")
}

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} className="shrink-0 rounded-full" style={{ width: size, height: size }} />
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-champagne/15 text-sm"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

function GuildLink({ guild }: { guild: GuildRef }) {
  return (
    <Link href={lookupPath(guild.id)} className={linkClass}>
      {guild.name}
    </Link>
  )
}

function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className={muted}>{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MatchCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={`${box} space-y-3`}>
      <h2 className={`text-xs ${muted}`}>{title}</h2>
      {children}
    </article>
  )
}

function yesNo(value: boolean): string {
  return value ? "是" : "否"
}

function UserCard({ user, cacheComplete }: { user: UserMatch; cacheComplete: boolean }) {
  return (
    <MatchCard title="使用者">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar url={user.avatar_url} name={user.name} />
        <div className="min-w-0">
          <p className="truncate">{user.name}</p>
          <p className={`text-xs ${muted}`}>@{user.username}</p>
        </div>
      </div>
      <Fields
        rows={[
          ["帳號建立", formatTime(user.created_at)],
          ["機器人", yesNo(user.bot)],
          ["Discord 官方", yesNo(user.system)],
        ]}
      />
      <section className="space-y-2">
        <h3 className="text-sm">共同伺服器（{fmt.format(user.guilds.length)}）</h3>
        {!cacheComplete && <p className={`text-xs ${muted}`}>成員資料載入中，清單可能不完整</p>}
        {user.guilds.length === 0 ? (
          <p className={`text-sm ${muted}`}>沒有共同伺服器</p>
        ) : (
          <ul className="space-y-2">
            {user.guilds.map(({ guild, member }) => (
              <li key={guild.id} className="border border-champagne/20 px-3 py-2 space-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar url={guild.icon_url} name={guild.name} size={24} />
                  <GuildLink guild={guild} />
                </div>
                {member === null ? (
                  <p className={`text-xs ${muted}`}>成員資料不在快取中</p>
                ) : (
                  <Fields
                    rows={[
                      ["暱稱", member.nick ?? "—"],
                      ["最高身分組", member.top_role.name],
                      ["加入時間", formatTime(member.joined_at)],
                      ["禁言中", yesNo(member.timed_out)],
                      ["目前狀態", memberStatusLabel(member.status)],
                      ["活動", member.status === null ? "不明" : (member.activity ?? "—")],
                    ]}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </MatchCard>
  )
}

function ChannelCard({ channel }: { channel: ChannelMatch }) {
  return (
    <MatchCard title="頻道">
      <p className="truncate">{channel.name ?? channel.id}</p>
      <Fields
        rows={[
          ["類型", channel.type],
          ["所屬類別", channel.category?.name ?? "—"],
          ["伺服器", channel.guild ? <GuildLink guild={channel.guild} /> : "—"],
          ["建立時間", formatTime(channel.created_at)],
        ]}
      />
    </MatchCard>
  )
}

function GuildCard({ guild }: { guild: GuildMatch }) {
  const owner = guild.owner
  return (
    <MatchCard title="伺服器">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar url={guild.icon_url} name={guild.name} />
        <p className="truncate">{guild.name}</p>
      </div>
      <Fields
        rows={[
          [
            "群主",
            owner ? (
              <Link href={lookupPath(owner.id)} className={linkClass}>
                {owner.name ?? owner.id}
              </Link>
            ) : (
              "不明"
            ),
          ],
          ["成員數", guild.member_count === null ? "不明" : fmt.format(guild.member_count)],
          ["文字頻道", fmt.format(guild.text_channels)],
          ["語音頻道", fmt.format(guild.voice_channels)],
          ["驗證等級", guild.verification_level],
          ["建立時間", formatTime(guild.created_at)],
        ]}
      />
    </MatchCard>
  )
}

function RoleCard({ role }: { role: RoleMatch }) {
  return (
    <MatchCard title="身分組">
      <p className="flex items-center gap-2 truncate">
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full border border-champagne/40"
          style={role.color ? { backgroundColor: role.color } : undefined}
        />
        {role.name}
      </p>
      <Fields
        rows={[
          ["伺服器", <GuildLink key="g" guild={role.guild} />],
          ["位置", String(role.position)],
          ["顏色", role.color ?? "無"],
          ["權限值", <code key="p">{role.permissions}</code>],
        ]}
      />
    </MatchCard>
  )
}

function MessageCard({ message }: { message: MessageMatch }) {
  const content = messageContentText(message)
  return (
    <MatchCard title="訊息">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar url={message.author.avatar_url} name={message.author.name} size={32} />
        <div className="min-w-0">
          <Link href={lookupPath(message.author.id)} className={`truncate ${linkClass}`}>
            {message.author.name}
          </Link>
          <p className={`text-xs ${muted}`}>
            {formatTime(message.created_at)}・#{message.channel.name ?? message.channel.id}
          </p>
        </div>
      </div>
      <p className={`whitespace-pre-wrap break-words text-sm ${content === null || message.content_hidden ? muted : ""}`}>
        {content ?? "（沒有文字內容）"}
      </p>
      {message.embeds.map((embed, i) => (
        <div key={i} className="border-l-2 border-champagne/50 pl-3 text-sm space-y-1">
          {embed.title && <p>{embed.title}</p>}
          {embed.description && <p className={`whitespace-pre-wrap ${muted}`}>{embed.description}</p>}
          {embed.fields?.map((field, j) => (
            <p key={j}>
              <span className={muted}>{field.name}：</span>
              {field.value}
            </p>
          ))}
        </div>
      ))}
      {message.attachments.length > 0 && (
        <ul className="text-sm">
          {message.attachments.map((a) => (
            <li key={a.url}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {a.filename}
              </a>
            </li>
          ))}
        </ul>
      )}
      <a href={message.jump_url} target="_blank" rel="noopener noreferrer" className={`text-xs ${linkClass}`}>
        在 Discord 開啟
      </a>
    </MatchCard>
  )
}

const KIND_TITLES = { user: "使用者", message: "訊息" } as const

function Match({ match, cacheComplete }: { match: LookupMatch; cacheComplete: boolean }) {
  if (isLookupFailure(match)) {
    return (
      <MatchCard title={KIND_TITLES[match.kind]}>
        <p className="text-sm">{lookupFailureText(match)}</p>
      </MatchCard>
    )
  }
  switch (match.kind) {
    case "user":
      return <UserCard user={match} cacheComplete={cacheComplete} />
    case "channel":
      return <ChannelCard channel={match} />
    case "guild":
      return <GuildCard guild={match} />
    case "role":
      return <RoleCard role={match} />
    case "message":
      return <MessageCard message={match} />
  }
}

function Results({ id, channelId }: { id: string; channelId: string | null }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchLookup(id, channelId, signal), [id, channelId])
  const { data, error, failed } = useLoad(fetcher)

  if (isNotBotOwner(error)) return <OpsForbidden />
  if (error instanceof DashboardApiError && error.code === "bot_unavailable") return <p className={muted}>星羽目前離線</p>
  if (error instanceof DashboardApiError && error.code === "invalid_id") return <p role="alert">ID 格式錯誤，請輸入數字 ID</p>
  if (failed) return <p className={muted}>查詢失敗，請稍後再試。</p>
  if (data === null) return <p className={muted}>查詢中…</p>

  if (data.matches.length === 0) {
    return (
      <div className="border border-champagne/30 px-4 py-8 text-center space-y-1">
        <p>查無此 ID</p>
        <p className={`text-sm ${muted}`}>依 ID 換算的建立時間：{formatTime(data.created_at)}</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className={`text-xs ${muted}`}>依 ID 換算的建立時間：{formatTime(data.created_at)}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {data.matches.map((match, i) => (
          <Match key={`${match.kind}-${i}`} match={match} cacheComplete={data.member_cache_complete} />
        ))}
      </div>
    </div>
  )
}

function LookupForm({ initialId, initialChannelId }: { initialId: string; initialChannelId: string }) {
  const router = useRouter()
  const [id, setId] = useState(initialId)
  const [channelId, setChannelId] = useState(initialChannelId)
  const [invalid, setInvalid] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmedId = id.trim()
    const trimmedChannel = channelId.trim()
    if (!isValidId(trimmedId) || (trimmedChannel !== "" && !isValidId(trimmedChannel))) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    router.push(lookupPath(trimmedId, trimmedChannel || undefined))
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-0 flex-1 basis-56">
          <span className="block mb-1.5 text-sm text-gray-600 dark:text-gray-400">ID</span>
          <Input value={id} inputMode="numeric" autoComplete="off" onChange={(e) => setId(e.target.value)} />
        </label>
        <label className="block min-w-0 flex-1 basis-56">
          <span className="block mb-1.5 text-sm text-gray-600 dark:text-gray-400">頻道 ID（查訊息時填）</span>
          <Input value={channelId} inputMode="numeric" autoComplete="off" onChange={(e) => setChannelId(e.target.value)} />
        </label>
        <Button type="submit">查詢</Button>
      </div>
      {invalid && <p role="alert" className="text-sm text-red-600 dark:text-red-400">ID 格式錯誤，請輸入數字 ID</p>}
    </form>
  )
}

/** ID 查詢：網址的 id、channel_id 參數改變時才查詢，可直接分享或從其他頁連過來。 */
export function OpsLookup() {
  const params = useSearchParams()
  const id = params.get("id")?.trim() ?? ""
  const channelId = params.get("channel_id")?.trim() ?? ""
  const valid = id !== "" && isValidId(id) && (channelId === "" || isValidId(channelId))

  return (
    <div className="space-y-6">
      {/* 網址換了（例如點卡片裡的連結）就用新參數重建表單 */}
      <LookupForm key={`${id}|${channelId}`} initialId={id} initialChannelId={channelId} />
      {id === "" ? null : valid ? (
        <Results id={id} channelId={channelId || null} />
      ) : (
        <p role="alert">ID 格式錯誤，請輸入數字 ID</p>
      )}
    </div>
  )
}
