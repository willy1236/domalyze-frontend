"use client"

export function HomeFooter() {
  return (
    <footer className="bg-background-light dark:bg-background-dark border-t border-champagne/30 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-constellation opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center gap-10 relative z-10">
        <a href="/" className="text-2xl font-serif tracking-[0.3em] text-champagne uppercase flex items-center gap-3 drop-shadow-[0_0_10px_rgba(196,208,232,0.4)] hover:opacity-80 transition-opacity">
          <span className="text-silver text-sm">✦</span> Xingyu <span className="text-silver text-sm">✦</span>
        </a>
        <div className="w-24 h-px bg-linear-to-r from-transparent via-silver/50 to-transparent"></div>
        <div className="flex gap-10 text-xs tracking-[0.2em] uppercase text-gray-400">
          <a className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2" href="#"><span className="text-[8px] opacity-70">✧</span> 隱私權政策</a>
          <a className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2" href="#"><span className="text-[8px] opacity-70">✧</span> 服務條款</a>
          <a className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2" href="#"><span className="text-[8px] opacity-70">✧</span> 聯絡我們</a>
        </div>
        <div className="text-xs tracking-wider text-gray-600 font-light mt-4">
          © 2024 星羽 Discord 機器人 (Xingyu Bot)。保留所有權利。
        </div>
      </div>
    </footer>
  )
}
