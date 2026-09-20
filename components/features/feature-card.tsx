"use client"

import { LucideIcon } from "lucide-react"
import { SeiuFeatureCard } from "@/components/seiu"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

/** 功能列表用的卡片；外觀交給元件庫，這裡只負責把 lucide 圖示接上去。 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <SeiuFeatureCard
      icon={<Icon className="h-5 w-5" strokeWidth={1.25} />}
      title={title}
      description={description}
    />
  )
}
