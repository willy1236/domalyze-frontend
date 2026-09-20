import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SeiuRoot } from "@/components/seiu"
import {
  HeroSection,
  HomeFeaturesSection,
  PerformanceSection,
  HomeInviteSection,
} from "@/components/home"

export default function Home() {
  return (
    // SeiuRoot 鋪底色、兩團光暈與會眨的星空層，取代原本三層手刻背景。
    <SeiuRoot>
      <main>
        <div className="noise-overlay opacity-[0.05] dark:opacity-[0.1]" />

        <Header />
        <HeroSection />
        <HomeFeaturesSection />
        <PerformanceSection />
        <HomeInviteSection />
        <Footer />
      </main>
    </SeiuRoot>
  )
}
