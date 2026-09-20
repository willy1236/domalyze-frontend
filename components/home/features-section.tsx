"use client"

import { Sparkles, Fingerprint, ArrowRightLeft, LucideIcon } from "lucide-react"
import { SeiuDivider, SeiuFeatureCard, SeiuLinkButton } from "@/components/seiu"

interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "版務與紀錄",
    description: "警告紀錄可跨伺服器共用，Ticket 私人頻道即時開設，動態語音房閒置後自動回收。設定過程中會逐項回報尚缺的權限。"
  },
  {
    icon: Fingerprint,
    title: "自動通知",
    description: "Twitch 開台、新影片與新剪輯，YouTube 新片，X 貼文，以及中央氣象署的地震與天氣警特報。12 種通知類型各自指定頻道、身分組與訊息內容。"
  },
  {
    icon: ArrowRightLeft,
    title: "遊戲與音樂",
    description: "六個遊戲平台綁定一次即可查詢，LOL 另提供對戰時間軸與近 20 場對手的牌位分布。音樂歌單綁定於雲端帳號，更換 Discord 帳號後依然保留。"
  }
]

export function HomeFeaturesSection() {
  return (
    <section
      id="features"
      className="relative border-b border-seiu-edge-soft bg-seiu-soft py-32 backdrop-blur-[18px]"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="relative mb-24 text-center">
          <span className="mb-4 block animate-seiu-sparkle text-xl text-seiu-accent-ink">
            ✦
          </span>
          <h2 className="mb-6 text-3xl text-seiu-ink md:text-5xl">核心功能</h2>
          <SeiuDivider className="mx-auto max-w-xs" />
        </div>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <SeiuFeatureCard
                key={feature.title}
                icon={<Icon className="h-5 w-5" strokeWidth={1.25} />}
                title={feature.title}
                description={feature.description}
              />
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <SeiuLinkButton href="/features" variant="panel">
            查看完整功能
          </SeiuLinkButton>
        </div>
      </div>
    </section>
  )
}
