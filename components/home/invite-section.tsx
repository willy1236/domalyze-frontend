"use client"

import {
  SeiuDivider,
  SeiuLinkButton,
  SeiuMonogram,
} from "@/components/seiu"

export function HomeInviteSection() {
  return (
    <section
      id="preorder"
      className="relative overflow-hidden bg-seiu-soft py-32 backdrop-blur-[18px]"
    >
      <SeiuMonogram
        letter="X"
        className="bottom-auto left-1/2 right-auto top-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-[0.06]"
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <span className="mb-6 flex items-center justify-center text-xs tracking-[0.25em] text-seiu-label">
          <span className="mr-3 animate-seiu-sparkle">✧</span> 加入伺服器{" "}
          <span className="ml-3 animate-seiu-sparkle">✧</span>
        </span>
        <h2 className="mb-8 text-4xl text-seiu-ink md:text-5xl">
          把星羽加入你的伺服器
        </h2>

        <SeiuDivider />
        <p className="py-6 font-light leading-relaxed text-seiu-body">
          授權一次即完成安裝。進入伺服器後以 /channel set
          指定通知頻道，其餘功能無須額外啟用。
        </p>
        <SeiuDivider className="mb-12" />

        <SeiuLinkButton
          href={process.env.NEXT_PUBLIC_BOT_INVITE_URL || ""}
          size="lg"
          external
        >
          邀請至伺服器
        </SeiuLinkButton>
      </div>
    </section>
  )
}
