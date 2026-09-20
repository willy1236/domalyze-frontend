"use client"

import { LucideIcon } from "lucide-react"
import { SeiuMonogram } from "@/components/seiu"
import { FeatureCard } from "./feature-card"

interface FeaturesData {
  icon: LucideIcon
  title: string
  description: string
}

interface FeaturesGridProps {
  features: FeaturesData[]
}

export function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <section className="relative border-b border-seiu-edge-soft bg-seiu-soft py-32 backdrop-blur-[18px]">
      <SeiuMonogram letter="Y" className="bottom-auto right-10 top-10" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
