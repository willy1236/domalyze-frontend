"use client"

import { EventResponseList } from "@/components/dashboard/channel/event-response-list"
import { useChannel, useReloadChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道的事件回應：開台、追隨、訂閱、續訂、贈訂、Raid 時星羽在聊天室說的話。星羽沒啟用時只能看。 */
export default function ChannelEventsPage() {
  const channel = useChannel()
  const reloadChannel = useReloadChannel()
  return (
    <section>
      <h2 className="text-2xl font-serif mb-2">事件回應</h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        發生這些事件時，星羽會在聊天室回應；沒有改過就使用預設文字，也可以個別關閉。
      </p>
      <EventResponseList channelId={channel.id} readOnly={channel.state !== "enabled"} onNotEnabled={() => void reloadChannel()} />
    </section>
  )
}
