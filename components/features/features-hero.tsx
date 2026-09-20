"use client"

import { SeiuCard, SeiuMonogram } from "@/components/seiu"

export function FeaturesHero() {
  return (
    <section className="relative flex min-h-150 items-center overflow-hidden border-b border-seiu-edge-soft pb-16 pt-32">
      <SeiuMonogram letter="✦" className="bottom-auto left-10 right-auto top-10" />

      <div className="pointer-events-none absolute left-[-10%] top-0 z-0 h-[60%] w-[60%] rounded-full bg-seiu-accent/30 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] z-0 h-[50%] w-[50%] rounded-full bg-seiu-mint/20 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <span className="mb-6 flex items-center justify-center text-xs tracking-[0.25em] text-seiu-label">
            <span className="mr-2 animate-seiu-sparkle">✧</span> 完整功能清單{" "}
            <span className="ml-2 animate-seiu-sparkle">✧</span>
          </span>
          <h1 className="relative mb-8 text-5xl leading-[1.1] text-seiu-ink lg:text-7xl">
            目前 <br />
            <span className="seiu-marker-lg">支援的功能</span>
          </h1>
          <SeiuCard className="mx-auto max-w-2xl px-6 py-4 text-lg font-light leading-relaxed text-seiu-body">
            以下皆為現行版本已實際運作的功能。標示為開發中的項目可正常使用，行為與細節仍可能調整。
          </SeiuCard>
        </div>
      </div>
    </section>
  )
}
