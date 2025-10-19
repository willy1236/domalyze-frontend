import { Card } from "@/components/ui/card"
import { Shield, Music, Zap, Users, MessageSquare, Trophy, Coins, Heart, Dice6, Bell, Target, Settings, Pickaxe } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "群組管理",
    description: "跨群警告紀錄、語音與成員活動記錄",
  },
  {
    icon: Bell,
    title: "通知系統",
    description: "地震、天氣、YouTube/Twitch/Twitter 推播",
    color: "text-orange-500",
  },
  {
    icon: Coins,
    title: "經濟系統",
    description: "虛擬貨幣儲值、賺錢與花費功能",
  },
  {
    icon: Music,
    title: "音樂系統",
    description: "播放 YouTube 音樂、音樂控制",
  },
  {
    icon: Users,
    title: "成員管理",
    description: "歡迎訊息、等級系統、成員統計與活躍度追蹤",
  },
  {
    icon: Trophy,
    title: "遊戲整合",
    description: "整合 Osu / Riot / Steam / Apex 等資料",
  },
  {
    icon: Heart,
    title: "寵物系統",
    description: "蒐集、培育與互動寵物",
  },
  {
    icon: Dice6,
    title: "賭盤系統",
    description: "類似 Twitch 實況預測的賭盤機制",
    color: "text-red-500",
  },
  {
    icon: Settings,
    title: "系統整合",
    description: "整合 Twitch Chat Bot、玩家資料庫",
    color: "text-indigo-500",
  },
  {
    icon: Pickaxe,
    title: "Minecraft 工具",
    description: "私人功能：伺服器狀態與控制",
    color: "text-emerald-500",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        {/*<h2 className="text-4xl md:text-5xl font-bold mb-4">強大的功能集</h2>*/}
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent">強大的功能集</h2>
        
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
