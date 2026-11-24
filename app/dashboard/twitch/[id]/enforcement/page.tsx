"use client"

import { useChannel, useReloadChannel } from "@/components/dashboard/channel/channel-access-guard"
import { EnforcementList } from "@/components/dashboard/channel/enforcement-list"

export default function ChannelEnforcementPage() {
  const channel = useChannel()
  const reloadChannel = useReloadChannel()
  return (
    <section>
      <h2 className="mb-6 text-2xl font-serif">執法紀錄</h2>
      <EnforcementList
        key={channel.id}
        channelId={channel.id}
        readOnly={channel.state !== "enabled"}
        onNotEnabled={() => void reloadChannel()}
      />
    </section>
  )
}
