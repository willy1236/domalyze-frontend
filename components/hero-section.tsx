import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">現已支援 50,000+ 伺服器</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
          為您的 Discord 伺服器
          <span className="block text-primary mt-2">注入強大功能</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
          NexusBot 提供自動化管理、音樂播放、遊戲整合等多種功能，讓您的社群體驗更上一層樓
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-12">
            立即邀請
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 h-12 bg-transparent">
            查看功能
          </Button>
        </div>

        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-2xl">
            <img src="/discord-bot-dashboard-interface-with-dark-theme.jpg" alt="Bot Dashboard" className="w-full rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}
