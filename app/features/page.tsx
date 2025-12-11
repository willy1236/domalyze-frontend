import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Music,
  Zap,
  Users,
  MessageSquare,
  Trophy,
  Lock,
  Ban,
  UserCheck,
  Volume2,
  ListMusic,
  Radio,
  Code,
  MessageCircle,
  Bot,
  Smile,
  BarChart3,
  Award,
  Target,
  Gamepad2,
  CheckCircle2,
  Terminal,
  Coins,
  ClipboardList,
  Store,
  Banknote,
  BellDot,
  Wrench,
  Dices,
  CalendarDays,
  Twitch,
  Server,
  BookUser,
  Receipt,
} from "lucide-react"
import BackgroundBlobs from "@/components/background-blobs"

const featureCategories = [
  {
    category: "自動化管理",
    icon: Bot,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    features: [
      {
        icon: BellDot,
        title: "通知系統",
        description: "成員異動、自動化通知和公告功能。",
        highlights: [],
        commands: ["/channel set"],
      },
      {
        icon: UserCheck,
        title: "社群通知",
        description: "自動通知新影片與直播，確保不錯過任何資訊。",
        highlights: [],
        commands: ["/youtube", "/twitch", "/twitter"],
      },
      {
        icon: Ban,
        title: "跨群警告系統",
        description: "記錄並同步多個伺服器的用戶警告記錄。",
        highlights: ["跨群聯動"],
        commands: ["/warning", "/timeout", "/kick", "/ban"],
      },
      {
        icon: Lock,
        title: "動態語音",
        description: "減少不必要的語音頻道，讓伺服器更整潔。",
        highlights: [],
        commands: ["/channel voice"],
      },
      {
        icon: MessageSquare,
        title: "管理工具",
        description: "各種管理指令和工具，提升管理效率",
        highlights: [],
        commands: ["/clean", "/poll", "/giveaway"],
      },
    ],
  },
    {
    category: "伺服器管理",
    icon: Shield,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    features: [
      {
        icon: Ban,
        title: "跨群警告系統",
        description: "記錄並同步多個伺服器的用戶警告記錄。",
        highlights: ["跨群聯動"],
        commands: ["/warning", "/timeout", "/kick", "/ban"],
      },
      {
        icon: Lock,
        title: "動態語音",
        description: "減少不必要的語音頻道，讓伺服器更整潔。",
        highlights: [],
        commands: ["/channel voice"],
      },
      {
        icon: MessageSquare,
        title: "管理工具",
        description: "各種管理指令和工具，提升管理效率",
        highlights: [],
        commands: ["/clean", "/poll", "/giveaway", "/ticket"],
      },
    ],
  },
  {
    category: "成員與使用者管理",
    icon: Users,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    features: [
      {
        icon: BookUser,
        title: "個人資料管理",
        description: "自訂成員個人資料",
        highlights: [],
        commands: ["/ui"],
      },
      {
        icon: BarChart3,
        title: "等級與經驗系統",
        description: "追蹤成員活躍度，透過等級系統獎勵活躍成員，提升社群參與度。（即將推出）",
        highlights: ["經驗值計算", "等級獎勵", "排行榜"],
        commands: [],
      },
      {
        icon: Award,
        title: "成員統計分析",
        description: "詳細的成員活動統計，包含訊息數量、語音時長和參與度分析。（即將推出）",
        highlights: ["活躍度追蹤", "圖表視覺化", "匯出報告"],
        commands: [],
      },
    ],
  },
  {
    category: "經濟系統",
    icon: Coins,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    features: [
      {
        icon: Banknote,
        title: "貨幣系統",
        description: "賺取、儲存和使用星塵",
        highlights: [],
        commands: ["/point"],
      },
      {
        icon: Store,
        title: "商店系統",
        description: "購買角色、道具或特殊權限（即將推出）",
        highlights: [],
        commands: [],
      },
      {
        icon: ClipboardList,
        title: "任務系統",
        description: "完成每日任務獲得獎勵（即將推出）",
        highlights: [],
        commands: [],
      },
      {
        icon: Receipt,
        title: "賭盤系統",
        description: "類似Twitch預測的賭盤系統（維修中）",
        highlights: [],
        commands: ["/bet"],
      }
    ],
  },
  {
    category: "音樂播放",
    icon: Music,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    features: [
      {
        icon: Volume2,
        title: "高品質音樂串流",
        description: "整合 YouTube 等主流音樂平台，一個指令播放所有音樂。",
        highlights: ["高品質音效", "多平台支援", "穩定連線"],
        commands: [],
      },
      {
        icon: ListMusic,
        title: "播放清單管理",
        description: "建立、儲存和分享您的播放清單，支援匯入和匯出功能。（即將推出）",
        highlights: ["無限清單", "協作編輯", "快速搜尋"],
        commands: [],
      }
    ],
  },
  {
    category: "遊戲整合",
    icon: Trophy,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    features: [
      {
        icon: Gamepad2,
        title: "遊戲統計查詢",
        description: "查詢多款熱門遊戲的玩家統計資料，包含排名、勝率和詳細數據。",
        highlights: ["多遊戲支援", "即時數據", "歷史記錄"],
        commands: ["/game", "/lol", "/apex", "/steam", "/dbd"],
      },
      {
        icon: Target,
        title: "排行榜系統",
        description: "建立伺服器內的遊戲排行榜，追蹤成員表現並促進良性競爭。（即將推出）",
        highlights: ["自動更新", "多種排序", "視覺化展示"],
        commands: [],
      },
      {
        icon: CheckCircle2,
        title: "成就追蹤功能",
        description: "追蹤遊戲成就和里程碑，自動通知成員達成的成就。（即將推出）",
        highlights: ["成就通知", "進度追蹤", "獎勵系統"],
        commands: [],
      },
    ],
  },
  {
    category: "其他工具",
    icon: Wrench,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    features: [
      {
        icon: Dices,
        title: "選擇",
        description: "讓機器人幫您做出選擇。",
        highlights: ["選項抽取", "成員選擇", "多次抽取"],
        commands: ["/choice"],
      },
      {
        icon: CalendarDays,
        title: "紀念日",
        description: "管理重要紀念日和事件。（即將推出）",
        highlights: ["自訂紀念"],
        commands: [],
      },
      {
        icon: Twitch,
        title: "Twitch 整合",
        description: "管理與整合 Twitch 聊天室。",
        highlights: ["聊天室管理", "跨平台整合"],
        commands: [],
      },
      {
        icon: Server,
        title: "Minecraft 工具（私人功能）",
        description: "即時監控與操控 Minecraft 伺服器",
        highlights: ["伺服器狀態", "玩家管理", "指令執行"],
        commands: ["/mcserver panel"],
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 star-field opacity-30 pointer-events-none" />

      <Header />

      <main className="relative">
        <BackgroundBlobs />
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">完整功能介紹</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            探索 <span className="text-primary" >星羽</span> 的強大功能
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            從自動化管理到 AI 聊天，從音樂播放到遊戲整合，星羽提供您所需的一切功能，讓您的 Discord 伺服器更加出色
          </p>
        </section>

        {/* Feature Categories */}
        {featureCategories.map((category, categoryIndex) => (
          <section key={categoryIndex} className="container mx-auto px-4 py-16">
            {/* Category Icon and Title */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${category.bgColor}`}>
                  <category.icon className={`w-7 h-7 ${category.color}`} />
                </div>
                <h2 className="text-4xl font-bold">{category.category}</h2>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.features.map((feature, featureIndex) => (
                <Card
                  key={featureIndex}
                  className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${category.bgColor} mb-4`}>
                    <feature.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, highlightIndex) => (
                      <Badge
                        key={highlightIndex}
                        variant="secondary"
                        className="bg-secondary/50 text-secondary-foreground"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-200">常用指令</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {feature.commands.map((command, cmdIndex) => (
                      <Badge
                        key={cmdIndex}
                        variant="secondary"
                        className="bg-slate-800/50 text-indigo-200 border-indigo-800/30 font-mono text-xs p-2"
                      >
                        <Code className="w-3 h-3 mr-1" />
                        {command}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            
            </div>
          </section>
        ))}

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="p-12 bg-linear-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/20 text-center">
            <h2 className="text-4xl font-bold mb-4">準備好開始了嗎？</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              立即邀請 星羽 到您的伺服器，體驗這些強大的功能
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                邀請機器人
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                查看文檔
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}
