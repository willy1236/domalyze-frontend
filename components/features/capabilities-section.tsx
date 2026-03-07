"use client"

import { CoreAdvantageCard } from "./core-advantage-card"

interface CoreAdvantageItem {
  title: string
  emoji: string
  items: string[]
}

interface CapabilitiesSectionProps {
  advantages: CoreAdvantageItem[]
}

export function CapabilitiesSection({ advantages }: CapabilitiesSectionProps) {
  return (
    <section className="py-32 relative overflow-hidden border-b border-silver/20">
      <div className="corner-monogram bottom-10 left-10 opacity-[0.05]">X</div>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="geometric-lines"></div>
        <div className="metallic-circle w-150 h-150 top-1/2 left-[20%] transform -translate-y-1/2 opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <span className="text-champagne tracking-[0.25em] uppercase text-xs font-medium mb-4 block drop-shadow-[0_0_8px_rgba(196,208,232,0.5)]">
            ✦
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-gray-900 dark:text-white mb-6">
            核心優勢
          </h2>
          <div className="w-16 h-px bg-linear-to-r from-transparent via-champagne to-transparent mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
          {advantages.map((advantage, index) => (
            <CoreAdvantageCard key={index} advantage={advantage} />
          ))}
        </div>
      </div>
    </section>
  )
}
