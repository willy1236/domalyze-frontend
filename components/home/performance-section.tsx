"use client"

import { ArrowRight } from "lucide-react"
import { LinkButton } from "@/components/ui"

export function PerformanceSection() {
  return (
    <section className="py-32 relative overflow-hidden border-b border-silver/20 min-h-200 flex items-center" id="performance">
      <div className="corner-monogram bottom-10 left-10 opacity-[0.05]">Y</div>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="geometric-lines"></div>
        <div className="metallic-circle w-150 h-150 top-1/2 left-[20%] transform -translate-y-1/2 opacity-20"></div>
        <div className="metallic-circle w-200 h-200 top-1/2 left-[10%] transform -translate-y-1/2 opacity-10 border-dashed"></div>
        <div className="absolute w-px h-[80%] bg-linear-to-b from-transparent via-champagne/30 to-transparent left-[30%] top-[10%]"></div>
        <div className="absolute h-px w-[60%] bg-linear-to-r from-transparent via-silver/20 to-transparent top-[40%] left-[10%]"></div>
        <div className="absolute w-4 h-4 rounded-full bg-champagne/50 shadow-[0_0_15px_var(--color-champagne)] top-[40%] left-[30%] transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-2 h-2 rounded-full bg-silver/60 top-[60%] left-[25%]"></div>
        <div className="absolute w-3 h-3 rounded-full bg-champagne/40 top-[30%] left-[45%]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <div className="relative group hidden lg:block">
          <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent backdrop-blur-sm border border-champagne/10 rounded-sm"></div>
          <div className="w-full aspect-4/5 relative">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-silver/30 rotate-45 backdrop-blur-md bg-white/5 flex items-center justify-center">
              <div className="w-1/2 h-1/2 border border-primary/30 dark:border-champagne/40 -rotate-45"></div>
            </div>
            <div className="absolute bottom-10 left-10 text-primary dark:text-champagne text-xs tracking-[0.2em] uppercase border-l border-champagne pl-4 backdrop-blur-sm bg-background-light/50 dark:bg-background-dark/30 py-2 pr-4">
              <span className="mr-2 text-shadow-sm">✧</span> 多平台架構
              <h4 className="font-serif text-xl text-gray-900 dark:text-white mt-1">Discord・Twitch・LINE</h4>
            </div>
          </div>
        </div>

        <div className="relative bg-background-light/80 dark:bg-background-dark/40 p-8 rounded-lg backdrop-blur-md border border-silver/10 lg:bg-transparent lg:p-0 lg:border-none lg:backdrop-blur-none">
          <div className="absolute -right-12 top-0 w-px h-full bg-linear-to-b from-transparent via-silver/30 to-transparent hidden lg:block"></div>
          <h2 className="font-serif text-3xl md:text-5xl text-gray-900 dark:text-white mb-8 leading-tight">
            不只在 <br />
            <span className="text-gray-400 dark:text-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Discord。</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 font-light leading-relaxed">
            星羽也在 Twitch 聊天室運作：自訂聊天指令、追隨與訂閱事件、頻道點數兌換。開台的瞬間，Twitch 聊天室與 Discord 通知頻道同步收到訊息。在 LINE 上把網址傳給她，會回一份風險檢查報告。
          </p>
          <ul className="space-y-5 mb-12 text-sm font-light text-gray-500 dark:text-gray-400">
            <li className="flex items-start"><span className="text-primary dark:text-champagne mr-3 mt-0.5 text-xs drop-shadow-[0_0_5px_rgba(196,208,232,0.8)]">✦</span> Twitch 開台、影片、剪輯，YouTube 與 X 更新，各自指定推播頻道</li>
            <li className="flex items-start"><span className="text-primary dark:text-champagne mr-3 mt-0.5 text-xs drop-shadow-[0_0_5px_rgba(196,208,232,0.8)]">✦</span> 地震 3 分鐘、天氣警特報 15 分鐘，資料取自中央氣象署</li>
            <li className="flex items-start"><span className="text-primary dark:text-champagne mr-3 mt-0.5 text-xs drop-shadow-[0_0_5px_rgba(196,208,232,0.8)]">✦</span> 歌單綁在雲端帳號，不是綁在某一個 Discord 帳號上</li>
          </ul>
          <LinkButton variant="text" href="/features" icon={<ArrowRight className="w-4 h-4" />}>
            查看完整功能
          </LinkButton>
        </div>
      </div>
    </section>
  )
}
