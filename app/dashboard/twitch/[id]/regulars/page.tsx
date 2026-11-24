"use client"

import { useChannel, useReloadChannel } from "@/components/dashboard/channel/channel-access-guard"
import { RegularList } from "@/components/dashboard/channel/regular-list"

export default function ChannelRegularsPage() {
  const channel = useChannel()
  const reloadChannel = useReloadChannel()
  return (
    <section>
      <h2 className="mb-6 text-2xl font-serif">常客</h2>
      <RegularList
        key={channel.id}
        channelId={channel.id}
        readOnly={channel.state !== "enabled"}
        onNotEnabled={() => void reloadChannel()}
      />
    </section>
  )
}
