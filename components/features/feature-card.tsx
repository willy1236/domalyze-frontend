"use client"

import { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="hover:shadow-[0_0_20px_rgba(196,208,232,0.2)]">
      <div className="absolute inset-0 bg-linear-to-b from-champagne/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Icon */}
      <div className="mb-6 text-primary dark:text-champagne relative z-10 drop-shadow-[0_0_10px_rgba(196,208,232,0.3)]">
        <Icon className="w-10 h-10 font-light" strokeWidth={1} />
      </div>

      {/* Title */}
      <h3 className="font-serif text-lg mb-4 text-gray-900 dark:text-white relative z-10 star-glyph">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed text-sm relative z-10 border-t border-silver/20 pt-4">
        {description}
      </p>

      {/* Decorative element */}
      <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-champagne/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Card>
  )
}
