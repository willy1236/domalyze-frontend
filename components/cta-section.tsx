import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">準備好提升您的 Discord 體驗了嗎？</h2>
        <p className="text-xl text-muted-foreground mb-10 text-pretty leading-relaxed">
          立即開始打造更好的伺服器環境
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-12">
            免費開始使用
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 h-12 bg-transparent">
            查看定價方案
          </Button>
        </div>
      </div>
    </section>
  )
}
