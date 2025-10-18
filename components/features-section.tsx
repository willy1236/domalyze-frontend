import { Card } from "@/components/ui/card"
import { Shield, Music, Zap, Users, MessageSquare, Trophy } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "自動化管理",
    description: "智能反垃圾訊息、自動角色分配、進階權限管理系統",
  },
  {
    icon: Music,
    title: "音樂播放",
    description: "高品質音樂串流、播放清單管理、支援多個音樂平台",
  },
  {
    icon: Zap,
    title: "自訂指令",
    description: "建立專屬指令、自動回覆、靈活的觸發條件設定",
  },
  {
    icon: Users,
    title: "成員管理",
    description: "歡迎訊息、等級系統、成員統計與活躍度追蹤",
  },
  {
    icon: MessageSquare,
    title: "AI 聊天",
    description: "智能對話機器人、多語言支援、自然語言處理",
  },
  {
    icon: Trophy,
    title: "遊戲整合",
    description: "遊戲統計查詢、排行榜系統、成就追蹤功能",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">強大的功能集</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">一個機器人，滿足您所有需求</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
