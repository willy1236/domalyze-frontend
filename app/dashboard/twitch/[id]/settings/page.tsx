"use client"

import { DeleteData } from "@/components/dashboard/channel/delete-data"
import { useChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道的設定：目前只有刪除所有資料，任何狀態都能使用。 */
export default function ChannelSettingsPage() {
  const channel = useChannel()
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">設定</h2>
      <DeleteData channelId={channel.id} login={channel.login} />
    </section>
  )
}
