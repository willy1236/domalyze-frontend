import { LinkButton } from "@/components/ui"
import { CHANNEL_LIST_PATH } from "@/lib/dashboard-channel"

export function TwitchHero() {
  return (
    <section className="relative min-h-150 flex items-center pt-32 pb-16 overflow-hidden border-b border-silver/20">
      <div className="corner-monogram top-10 left-10">✦</div>
      <div className="absolute top-[0%] left-[-10%] w-[60%] h-[60%] bg-primary/30 dark:bg-primary/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-champagne/20 dark:bg-champagne/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full relative z-10">
        <div className="text-center">
          <span className="text-primary dark:text-champagne tracking-[0.25em] uppercase text-xs font-medium mb-6 flex items-center justify-center">
            <span className="mr-2 opacity-80">✧</span> Twitch bot <span className="ml-2 opacity-80">✧</span>
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl leading-[1.1] mb-8 text-gray-900 dark:text-white relative drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            星羽的 <br />
            <span className="text-gray-400 dark:text-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Twitch bot</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            在聊天室自訂指令、定時發送訊息、回應追隨與訂閱，也能把事件轉發到 Discord。用 Twitch 帳號登入後台，按下啟用，星羽立即加入你的頻道，不需要重啟。
          </p>
          <LinkButton href={CHANNEL_LIST_PATH}>開始使用</LinkButton>
        </div>
      </div>
    </section>
  )
}
