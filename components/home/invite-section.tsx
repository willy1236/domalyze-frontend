"use client"

import { HomeButton } from "./button"

export function HomeInviteSection() {
  return (
    <section className="py-32 bg-surface-light/50 dark:bg-surface-dark/80 relative overflow-hidden backdrop-blur-lg" id="preorder">
      <div className="corner-monogram top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-[20rem]">X</div>
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-champagne/40 to-transparent"></div>
      
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <span className="text-champagne tracking-[0.25em] uppercase text-xs font-medium mb-6 flex justify-center items-center"><span className="mr-3 opacity-70 text-shadow-sm">✧</span> 邀請機器人 <span className="ml-3 opacity-70 text-shadow-sm">✧</span></span>
        <h2 className="font-serif text-4xl md:text-5xl text-gray-900 dark:text-white mb-8">立即將星羽加入您的伺服器</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-12 font-light leading-relaxed border-t border-b border-silver/20 py-6">
          點擊下方連結，將星羽機器人添加到您的 Discord 伺服器。只需一鍵授權，即可開始體驗專業級的社群管理功能。
        </p>
        <HomeButton 
          href={process.env.NEXT_PUBLIC_BOT_INVITE_URL || ""}
          variant="secondary"
          external
        >
          邀請至伺服器
        </HomeButton>
      </div>
    </section>
  )
}
