"use client"

import { useChannel } from "@/components/dashboard/channel/channel-access-guard"

/** 頻道總覽：先說明 bot 的狀態，之後的卡再加上擋下紀錄等內容。 */
export default function ChannelOverviewPage() {
  const channel = useChannel()
  const enabled = channel.state === "enabled"
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">總覽</h2>
      <p className="border border-champagne/30 px-4 py-6">
        {enabled
          ? "星羽 bot 已在這個頻道運作。"
          : "星羽 bot 還沒有在這個頻道啟用。啟用後，bot 會加入你的聊天室並回應指令。"}
      </p>
    </section>
  )
}
