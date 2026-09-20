"use client"

import { SeiuCard, SeiuStarredList } from "@/components/seiu"

interface CoreAdvantageItem {
  title: string
  emoji: string
  items: string[]
}

interface CoreAdvantageCardProps {
  advantage: CoreAdvantageItem
}

export function CoreAdvantageCard({ advantage }: CoreAdvantageCardProps) {
  return (
    <SeiuCard tone="surface" className="relative">
      {/* 左上角那道短線，沿用原本的「停點」記號 */}
      <span className="absolute -left-px top-0 h-12 w-0.5 bg-seiu-accent" />
      <h3 className="mb-6 text-2xl text-seiu-ink">
        {advantage.emoji} {advantage.title}
      </h3>
      <SeiuStarredList items={advantage.items} />
    </SeiuCard>
  )
}
