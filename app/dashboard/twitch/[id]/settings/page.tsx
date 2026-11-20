"use client"

import { DeleteData } from "@/components/dashboard/channel/delete-data"
import { ModCollab } from "@/components/dashboard/channel/mod-collab"
import { useChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道的設定：mod 協作開關（mod 只看狀態）與刪除所有資料（mod 看不到），任何狀態都能使用。 */
export default function ChannelSettingsPage() {
  const channel = useChannel()
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">設定</h2>
      <div className="space-y-6">
        <ModCollab channelId={channel.id} enabled={channel.mod_collab_enabled} role={channel.role} />
        {channel.role === "owner" && <DeleteData channelId={channel.id} login={channel.login} />}
      </div>
    </section>
  )
}
