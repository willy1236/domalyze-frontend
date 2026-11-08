"use client"

import { HomeButton } from "./button"

export function HomeInviteSection() {
  return (
    <section className="py-32 bg-surface-light/50 dark:bg-surface-dark/80 relative overflow-hidden backdrop-blur-lg" id="preorder">
      <div className="corner-monogram top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-[20rem]">X</div>
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-champagne/40 to-transparent"></div>
      
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <span className="text-primary dark:text-champagne tracking-[0.25em] uppercase text-xs font-medium mb-6 flex justify-center items-center"><span className="mr-3 opacity-70 text-shadow-sm">✧</span> 加入伺服器 <span className="ml-3 opacity-70 text-shadow-sm">✧</span></span>
        <h2 className="font-serif text-4xl md:text-5xl text-gray-900 dark:text-white mb-8">把星羽加入你的伺服器</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-12 font-light leading-relaxed border-t border-b border-silver/20 py-6">
          不必事先規劃要啟用哪些功能。邀請星羽加入後，以 /help 瀏覽指令，需要時再逐項設定。
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
