"use client"

import { ArrowRight } from "lucide-react"
import {
  SeiuAstrolabeFrame,
  SeiuCard,
  SeiuGridBackdrop,
  SeiuLinkButton,
  SeiuMonogram,
  SeiuSideLabel,
  SeiuStarredList,
} from "@/components/seiu"

export function PerformanceSection() {
  return (
    <section
      id="performance"
      className="relative flex min-h-200 items-center overflow-hidden border-b border-seiu-edge-soft py-32"
    >
      <SeiuGridBackdrop />
      <SeiuMonogram letter="Y" className="bottom-10 left-10 right-auto" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 px-6 lg:grid-cols-2 lg:px-12">
        {/* 左邊那塊視覺，改用元件庫的星盤框當骨架 */}
        <SeiuCard tone="surface" className="relative hidden lg:block">
          <SeiuAstrolabeFrame className="h-[420px] scale-[1.4]" />
          <SeiuSideLabel
            eyebrow="✧ 多平台架構"
            title="Discord・Twitch・LINE・Web API"
            className="mt-6"
          />
        </SeiuCard>

        <div className="relative">
          <h2 className="mb-8 text-3xl leading-tight text-seiu-ink md:text-5xl">
            四個平台，<br />
            <span className="seiu-marker-lg">一套後台。</span>
          </h2>
          <p className="mb-8 text-lg font-light leading-relaxed text-seiu-body">
            星羽同時運行於 Discord、Twitch 聊天室、LINE 與一台 FastAPI
            伺服器，四端共用同一份資料。開台的瞬間，Twitch 聊天室與 Discord
            通知頻道同步收到訊息；透過 Discord 授權時已連結的 Twitch 帳號，後續查詢無須重複輸入。
          </p>

          <SeiuStarredList
            className="mb-12"
            items={[
              "Discord、Twitch、Google 三種 OAuth，綁定後資料互通",
              "地震 3 分鐘、天氣警特報 15 分鐘，資料取自中央氣象署",
              "歌單綁在雲端帳號，不是綁在某一個 Discord 帳號上",
            ]}
          />

          <SeiuLinkButton href="/features" variant="text">
            查看完整功能 <ArrowRight className="h-4 w-4" />
          </SeiuLinkButton>
        </div>
      </div>
    </section>
  )
}
