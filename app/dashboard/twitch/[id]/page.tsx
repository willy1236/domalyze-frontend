"use client"

import { AutomodBlocks } from "@/components/dashboard/channel/automod-blocks"
import { useChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道總覽：先說明星羽的狀態，再列出最近被擋下的訊息。 */
export default function ChannelOverviewPage() {
  const channel = useChannel()
  const enabled = channel.state === "enabled"
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">總覽</h2>
      <p className="border border-champagne/30 px-4 py-6">
        {enabled
          ? "星羽已在這個頻道運作。"
          : "星羽還沒有在這個頻道啟用。啟用後，星羽會加入你的聊天室並回應指令。"}
      </p>
      <AutomodBlocks channelId={channel.id} />
    </section>
  )
}
