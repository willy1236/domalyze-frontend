"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SeiuRoot } from "@/components/seiu"
import { FeaturesHero } from "@/components/features/features-hero"
import { FeaturesGrid } from "@/components/features/features-grid"
import { CapabilitiesSection } from "@/components/features/capabilities-section"
import { FeaturesCTA } from "@/components/features/features-cta"
import { FEATURES_DATA, CORE_ADVANTAGES } from "@/lib/features-data"

export default function FeaturesPage() {
  return (
    <SeiuRoot>
      <main>
        <div className="noise-overlay opacity-[0.05] dark:opacity-[0.1]" />

        <Header />
        <FeaturesHero />
        <FeaturesGrid features={FEATURES_DATA} />
        <CapabilitiesSection advantages={CORE_ADVANTAGES} />
        <FeaturesCTA />
        <Footer />
      </main>
    </SeiuRoot>
  )
}
