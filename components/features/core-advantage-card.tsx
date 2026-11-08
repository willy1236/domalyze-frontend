"use client"

import type { LucideIcon } from "lucide-react"

export interface CoreAdvantageItem {
  title: string
  icon: LucideIcon
  items: string[]
}

interface CoreAdvantageCardProps {
  advantage: CoreAdvantageItem
}

export function CoreAdvantageCard({ advantage }: CoreAdvantageCardProps) {
  const Icon = advantage.icon
  return (
    <div className="relative bg-background-light/80 dark:bg-background-dark/40 p-8 rounded-lg backdrop-blur-md border border-silver/10">
      <div className="absolute -left-1 top-0 w-px h-12 bg-champagne shadow-[0_0_10px_var(--color-champagne)]"></div>
      <h3 className="font-serif text-2xl text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <Icon className="w-6 h-6 shrink-0 text-primary dark:text-champagne drop-shadow-[0_0_10px_rgba(196,208,232,0.3)]" strokeWidth={1.25} aria-hidden />
        {advantage.title}
      </h3>
      <ul className="space-y-3 text-sm font-light text-gray-500 dark:text-gray-400">
        {advantage.items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="text-primary dark:text-champagne mr-3 mt-0.5 text-xs drop-shadow-[0_0_5px_rgba(196,208,232,0.8)]">
              ✦
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
