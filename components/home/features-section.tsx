"use client"

import { Sparkles, Fingerprint, ArrowRightLeft, LucideIcon } from "lucide-react"
import { HomeButton } from "./button"

interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "版務與紀錄",
    description: "警告紀錄可跨伺服器共用，Ticket 私人頻道即時開設，動態語音房無人時自動回收。設定過程中會逐項回報尚缺的權限。"
  },
  {
    icon: Fingerprint,
    title: "自動通知",
    description: "Twitch 開台、新影片與新剪輯，YouTube 新片，X 貼文，以及中央氣象署的地震與天氣警特報。每種通知各自指定發送頻道。"
  },
  {
    icon: ArrowRightLeft,
    title: "遊戲與音樂",
    description: "LOL、osu!、Apex、Dead by Daylight 與 Steam 的玩家資料查詢，LOL 另可統計最近對戰中所有玩家的牌位分布。音樂歌單綁定於雲端帳號，更換 Discord 帳號後依然保留。"
  }
]

export function HomeFeaturesSection() {
  return (
    <section className="py-32 bg-surface-light/30 dark:bg-surface-dark/60 relative border-b border-silver/20 backdrop-blur-md" id="features">
      <div className="corner-monogram top-10 right-10 opacity-[0.05]">X</div>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-24 relative">
          <span className="text-primary dark:text-champagne text-xl opacity-70 block mb-4 drop-shadow-[0_0_8px_rgba(196,208,232,0.5)]">✦</span>
          <h2 className="font-serif text-3xl md:text-5xl text-gray-900 dark:text-white mb-6">核心功能</h2>
          <div className="w-16 h-px bg-linear-to-r from-transparent via-champagne to-transparent mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="group relative p-8 border border-transparent hover:border-champagne/20 transition-colors duration-500 bg-background-light/50 dark:bg-background-dark/20 backdrop-blur-sm">
                <div className="absolute inset-0 bg-linear-to-b from-champagne/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-6 text-primary dark:text-champagne relative z-10 drop-shadow-[0_0_10px_rgba(196,208,232,0.3)]">
                  <Icon className="w-10 h-10 font-light" strokeWidth={1} />
                </div>
                <h3 className="font-serif text-xl mb-4 text-gray-900 dark:text-white relative z-10 star-glyph">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed text-sm relative z-10 border-t border-silver/20 pt-4">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-16">
          <HomeButton href="/features">查看完整功能</HomeButton>
        </div>
      </div>
    </section>
  )
}
