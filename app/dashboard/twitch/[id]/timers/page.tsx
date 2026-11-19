"use client"

import { TimerList } from "@/components/dashboard/channel/timer-list"
import { useChannel, useReloadChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道的計時訊息：開台中定時在聊天室發送。星羽沒啟用時只能看。 */
export default function ChannelTimersPage() {
  const channel = useChannel()
  const reloadChannel = useReloadChannel()
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">計時訊息</h2>
      <TimerList channelId={channel.id} readOnly={channel.state !== "enabled"} onNotEnabled={() => void reloadChannel()} />
    </section>
  )
}
