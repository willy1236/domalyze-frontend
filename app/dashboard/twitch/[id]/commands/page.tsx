"use client"

import { CommandList } from "@/components/dashboard/channel/command-list"
import { useChannel, useReloadChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道的自訂指令：觀眾在聊天室輸入 !名稱 觸發。星羽沒啟用時只能看。 */
export default function ChannelCommandsPage() {
  const channel = useChannel()
  const reloadChannel = useReloadChannel()
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">指令</h2>
      <CommandList channelId={channel.id} readOnly={channel.state !== "enabled"} onNotEnabled={() => void reloadChannel()} />
    </section>
  )
}
