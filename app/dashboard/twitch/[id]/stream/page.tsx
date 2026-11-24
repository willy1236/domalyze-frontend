"use client"

import { useChannel } from "@/components/dashboard/channel/channel-access-guard"
import { StreamInfoForm } from "@/components/dashboard/channel/stream-info-form"

export default function ChannelStreamInfoPage() {
  const channel = useChannel()
  return (
    <section>
      <h2 className="mb-6 text-2xl font-serif">實況資訊</h2>
      <StreamInfoForm key={channel.id} channelId={channel.id} role={channel.role} readOnly={channel.state !== "enabled"} />
    </section>
  )
}
