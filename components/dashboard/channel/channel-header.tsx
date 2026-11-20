"use client"

import { ChannelStatus } from "./channel-status"
import { useChannel } from "./channel-access-guard"

/** 頻道頁頂端：頭像、名稱與星羽狀態。 */
export function ChannelHeader() {
  const channel = useChannel()
  return (
    <div className="flex items-center gap-3 min-w-0">
      {channel.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={channel.avatar_url} alt="" width={48} height={48} className="w-12 h-12 rounded-full shrink-0" />
      ) : (
        <span
          aria-hidden
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-champagne/20 text-champagne font-serif"
        >
          {Array.from(channel.name)[0] ?? "?"}
        </span>
      )}
      <div className="min-w-0">
        <h1 className="font-serif text-2xl leading-tight text-primary dark:text-silver truncate">{channel.name}</h1>
        <div className="mt-1">
          <ChannelStatus state={channel.state} channelId={channel.id} health={channel.health} role={channel.role} />
        </div>
      </div>
    </div>
  )
}
