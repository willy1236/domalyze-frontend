import type { PersonalDiscord } from "@/lib/dashboard-personal"

/** 一個 Discord 的頭像與名稱；目前登入的那個加上標示 */
export function DiscordIdentity({ discord }: { discord: PersonalDiscord }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={discord.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full shrink-0" />
      <span className="min-w-0 truncate">{discord.name}</span>
      {discord.current && <span className="text-xs tracking-widest text-champagne shrink-0">目前</span>}
    </div>
  )
}
