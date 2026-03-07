"use client"

export function FeaturesHero() {
  return (
    <section className="relative min-h-150 flex items-center pt-32 pb-16 overflow-hidden border-b border-silver/20">
      <div className="corner-monogram top-10 left-10">✦</div>
      <div className="absolute top-[0%] left-[-10%] w-[60%] h-[60%] bg-primary/30 dark:bg-primary/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-champagne/20 dark:bg-champagne/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full relative z-10">
        <div className="text-center mb-16">
          <span className="text-champagne tracking-[0.25em] uppercase text-xs font-medium mb-6 flex items-center justify-center">
            <span className="mr-2 opacity-80">✧</span> 完整功能列表 <span className="ml-2 opacity-80">✧</span>
          </span>
          <h1 className="font-serif text-5xl lg:text-7xl leading-[1.1] mb-8 text-gray-900 dark:text-white relative drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            精選 <br />
            <span className="italic text-gray-400 dark:text-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">功能集成</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed border-l border-r border-champagne/40 px-6 py-4 relative bg-background-dark/5 dark:bg-background-dark/40 backdrop-blur-md rounded-lg shadow-lg">
            <span className="absolute -left-px top-0 w-px h-8 bg-champagne shadow-[0_0_10px_var(--color-champagne)]"></span>
            <span className="absolute -right-px top-0 w-px h-8 bg-champagne shadow-[0_0_10px_var(--color-champagne)]"></span>
            為您的 Discord 社群提供無與倫比的管理體驗。
          </p>
        </div>
      </div>
    </section>
  )
}
