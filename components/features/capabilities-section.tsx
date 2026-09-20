"use client"

import { SeiuDivider, SeiuGridBackdrop, SeiuMonogram } from "@/components/seiu"
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
    <section className="relative overflow-hidden border-b border-seiu-edge-soft py-32">
      <SeiuGridBackdrop />
      <SeiuMonogram letter="X" className="bottom-10 left-10 right-auto" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <span className="mb-4 block animate-seiu-sparkle text-xl text-seiu-accent-ink">
            ✦
          </span>
          <h2 className="mb-6 text-3xl text-seiu-ink md:text-5xl">核心優勢</h2>
          <SeiuDivider className="mx-auto max-w-xs" />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
          {advantages.map((advantage) => (
            <CoreAdvantageCard key={advantage.title} advantage={advantage} />
          ))}
        </div>
      </div>
    </section>
  )
}
