"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeaturesGrid } from "@/components/features"
import { TwitchCTA, TwitchHero, TwitchSteps } from "@/components/twitch"
import { TWITCH_FEATURES } from "@/lib/features-data"

export default function TwitchPage() {
  return (
    <main>
      <div className="noise-overlay dark:opacity-[0.1] opacity-[0.05]"></div>
      <div className="celestial-dust"></div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 dark:opacity-[0.4] bg-size-[150px_150px] bg-constellation"></div>

      <Header />
      <TwitchHero />
      <FeaturesGrid features={TWITCH_FEATURES} />
      <TwitchSteps />
      <TwitchCTA />
      <Footer />
    </main>
  )
}
