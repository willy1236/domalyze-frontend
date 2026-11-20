"use client"

import { DeleteData } from "@/components/dashboard/channel/delete-data"
import { useChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道的設定：刪除所有資料只有實況主能用，任何狀態都能使用；mod 看不到。 */
export default function ChannelSettingsPage() {
  const channel = useChannel()
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">設定</h2>
      {channel.role === "owner" && <DeleteData channelId={channel.id} login={channel.login} />}
    </section>
  )
}
