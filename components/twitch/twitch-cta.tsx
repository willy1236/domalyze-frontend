import { LinkButton } from "@/components/ui"
import { CHANNEL_LIST_PATH } from "@/lib/dashboard-channel"

export function TwitchCTA() {
  return (
    <section className="py-32 bg-surface-light/50 dark:bg-surface-dark/80 relative overflow-hidden backdrop-blur-lg">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-champagne/40 to-transparent"></div>
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="font-serif text-3xl md:text-5xl text-gray-900 dark:text-white mb-8">用 Twitch 帳號開始</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-12 font-light leading-relaxed border-t border-b border-silver/20 py-6">
          登入後在頻道後台啟用星羽。
        </p>
        <LinkButton href={CHANNEL_LIST_PATH}>開始使用</LinkButton>
      </div>
    </section>
  )
}
