"use client"

import { LinkButton } from "@/components/ui"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden border-b border-silver/20 perspective-distant">
      <div className="corner-monogram top-10 left-10">X</div>
      <div className="corner-monogram bottom-10 right-10">Y</div>
      <div className="absolute top-[0%] left-[-10%] w-[60%] h-[60%] bg-primary/30 dark:bg-primary/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-champagne/20 dark:bg-champagne/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0"></div>
      
      <div className="absolute top-1/2 left-[50%] lg:left-[65%] w-200 h-200 lg:w-300 lg:h-300 pointer-events-none z-0 transform -translate-x-1/2 -translate-y-1/2 opacity-70 preserve-3d rotate-x-30 rotate-y-[-15deg] scale-110">
        <div className="relative w-full h-full preserve-3d">
          <div className="absolute top-1/2 left-1/2 w-[90%] h-[90%] transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne/10 shadow-[0_0_60px_rgba(196,208,232,0.15)] bg-linear-to-tr from-transparent to-champagne/5"></div>
          <div className="absolute top-1/2 left-1/2 w-[80%] h-[80%] transform -translate-x-1/2 -translate-y-1/2 rounded-full astrolabe-markings"></div>
          <div className="absolute top-1/2 left-1/2 w-[85%] h-[85%] transform -translate-x-1/2 -translate-y-1/2 rounded-full astrolabe-markings-fine opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 w-[70%] h-[70%] transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-silver/30 border-dashed shadow-[inset_0_0_20px_rgba(224,229,240,0.1)]"></div>
          <div className="absolute top-1/2 left-1/2 w-[75%] h-[75%] transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 dark:border-champagne/40 shadow-[0_0_15px_rgba(196,208,232,0.2)] rotate-x-45 rotate-y-30"></div>
          <div className="absolute top-1/2 left-1/2 w-[60%] h-[60%] transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-silver/20 rotate-x-[-30deg] rotate-y-45 shadow-[0_0_25px_rgba(224,229,240,0.1)]"></div>
          <div className="absolute top-1/2 left-1/2 w-[40%] h-[40%] transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-double border-champagne/30 backdrop-blur-[2px]"></div>
          <div className="absolute top-1/2 left-1/2 w-[42%] h-[42%] transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne/20 border-dotted"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-tr from-champagne/20 to-transparent border border-primary/30 dark:border-champagne/50 backdrop-blur-md shadow-[0_0_40px_rgba(196,208,232,0.4)] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-champagne/90 shadow-[0_0_20px_rgba(196,208,232,0.8),inset_0_0_10px_rgba(255,255,255,1)]"></div>
            <div className="absolute w-32 h-32 rounded-full border border-silver/40"></div>
            <div className="absolute w-40 h-40 rounded-full border border-champagne/20 border-dashed"></div>
          </div>
          <div className="absolute top-[15%] left-[50%] w-4 h-4 rounded-full bg-white shadow-[0_0_15px_#fff]"></div>
          <div className="absolute top-[60%] left-[80%] w-3 h-3 rounded-full bg-champagne shadow-[0_0_12px_var(--color-champagne)]"></div>
          <div className="absolute top-[85%] left-[40%] w-2 h-2 rounded-full bg-silver shadow-[0_0_8px_var(--color-silver)]"></div>
          <div className="absolute top-[40%] left-[10%] w-5 h-5 rounded-full bg-champagne shadow-[0_0_20px_var(--color-champagne)]"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        <div className="lg:col-span-8 flex flex-col justify-center relative z-20">
          <div className="absolute -left-6 top-0 w-px h-full bg-linear-to-b from-transparent via-silver/30 to-transparent"></div>
          <span className="text-primary dark:text-champagne tracking-[0.25em] uppercase text-xs font-medium mb-6 flex items-center"><span className="mr-2 opacity-80 text-shadow-sm">✧</span> 星羽 ・ Discord 社群機器人 <span className="ml-2 opacity-80 text-shadow-sm">✧</span></span>
          <h1 className="font-serif text-5xl lg:text-7xl leading-[1.1] mb-8 text-gray-900 dark:text-white relative drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            交給她，<br/>
            <span className="text-gray-400 dark:text-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">然後去忙別的。</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 font-light leading-relaxed max-w-lg border-l border-primary/30 dark:border-champagne/40 pl-6 py-2 relative bg-background-dark/5 dark:bg-background-dark/40 backdrop-blur-md rounded-r-lg shadow-lg">
            <span className="absolute -left-px top-0 w-px h-8 bg-champagne shadow-[0_0_10px_var(--color-champagne)]"></span>
            管理一個社群，花掉時間的從來不是大事，而是設通知、開私人頻道、查戰績、清語音房這些瑣事。星羽把它們接走，剩下的時間還給你。
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <LinkButton
              href={process.env.NEXT_PUBLIC_BOT_INVITE_URL || ""}
              variant="secondary"
              external
            >
              邀請至伺服器
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  )
}
