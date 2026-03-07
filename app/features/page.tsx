"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeaturesHero } from "@/components/features/features-hero"
import { FeaturesGrid } from "@/components/features/features-grid"
import { CapabilitiesSection } from "@/components/features/capabilities-section"
import { FeaturesCTA } from "@/components/features/features-cta"
import { FEATURES_DATA, CORE_ADVANTAGES } from "@/lib/features-data"

export default function FeaturesPage() {
  return (
    <main>
      <div className="noise-overlay dark:opacity-[0.1] opacity-[0.05]"></div>
      <div className="celestial-dust"></div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 dark:opacity-[0.4] bg-size-[150px_150px] bg-constellation"></div>

      <Header />
      <FeaturesHero />
      <FeaturesGrid features={FEATURES_DATA} />
      <CapabilitiesSection advantages={CORE_ADVANTAGES} />
      <FeaturesCTA />
      <Footer />
    </main>
  )
}
