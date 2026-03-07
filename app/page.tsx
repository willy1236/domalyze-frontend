import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection, HomeFeaturesSection, PerformanceSection, HomeInviteSection } from "@/components/home"

export default function Home() {
  return (
    <main>
      <div className="noise-overlay dark:opacity-[0.1] opacity-[0.05]"></div>
      <div className="celestial-dust"></div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 dark:opacity-[0.4] bg-size-[150px_150px] bg-constellation"></div>
      
      <Header />
      <HeroSection />
      <HomeFeaturesSection />
      <PerformanceSection />
      <HomeInviteSection />
      <Footer />
    </main>
  )
}
