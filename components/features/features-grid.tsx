"use client"

import { LucideIcon } from "lucide-react"
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
    <section className="py-32 bg-surface-light/30 dark:bg-surface-dark/60 relative border-b border-silver/20 backdrop-blur-md">
      <div className="corner-monogram top-10 right-10 opacity-[0.05]">Y</div>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
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
