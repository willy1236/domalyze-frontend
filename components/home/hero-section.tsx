"use client"

import {
  SeiuAstrolabeFrame,
  SeiuLinkButton,
  SeiuMonogram,
  SeiuSideLabel,
} from "@/components/seiu"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden border-b border-seiu-edge-soft pb-12 pt-24">
      <SeiuMonogram letter="X" className="left-10 top-10 bottom-auto right-auto" />
      <SeiuMonogram letter="Y" className="bottom-10 right-10" />

      {/* 兩團光暈，跟著主題換色 */}
      <div className="pointer-events-none absolute left-[-10%] top-0 z-0 h-[60%] w-[60%] rounded-full bg-seiu-accent/30 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] z-0 h-[50%] w-[50%] rounded-full bg-seiu-mint/20 blur-[120px]" />

      {/* 星盤：原本是手刻的同心圓，改用元件庫的裝飾框放大擺進來 */}
      <div className="pointer-events-none absolute left-[50%] top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-70 lg:left-[65%]">
        <SeiuAstrolabeFrame className="scale-[2.4] lg:scale-[3.4]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-12 lg:px-12">
        <div className="relative z-20 flex flex-col justify-center lg:col-span-8">
          <span className="mb-6 flex items-center text-xs tracking-[0.25em] text-seiu-label">
            <span className="mr-2 animate-seiu-sparkle">✧</span> 星羽 ・ Xingyu{" "}
            <span className="ml-2 animate-seiu-sparkle">✧</span>
          </span>

          <h1 className="relative mb-8 text-5xl leading-[1.1] text-seiu-ink lg:text-7xl">
            交給她，<br />
            <span className="seiu-marker-lg">然後去忙別的。</span>
          </h1>

          <SeiuSideLabel
            eyebrow="✦ Discord ・ Twitch ・ LINE"
            title={
              <span className="max-w-lg text-lg font-light leading-relaxed text-seiu-body">
                管理一個社群，花掉時間的從來不是大事，而是設通知、開私人頻道、查戰績、清語音房這些瑣事。
                星羽把它們接走，剩下的時間還給你。
              </span>
            }
            className="mb-10 max-w-lg"
          />

          <div className="flex flex-col gap-6 sm:flex-row">
            <SeiuLinkButton
              href={process.env.NEXT_PUBLIC_BOT_INVITE_URL || ""}
              size="lg"
              external
            >
              邀請至伺服器
            </SeiuLinkButton>
          </div>
        </div>
      </div>
    </section>
  )
}
