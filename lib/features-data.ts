import { Sparkles,
  Fingerprint,
  ArrowRightLeft,
  Brain,
  Shield,
  Zap,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Lock,
  Cpu,
  Music, Trophy, Coins, Heart, Dice6, Bell, Target, Pickaxe } from "lucide-react"

export const FEATURES_DATA = [
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

export const CORE_ADVANTAGES = [
  {
    title: "多平台整合",
    emoji: "🌐",
    items: [
      "Discord / Twitch / LINE 一站整合",
      "Web API 與 OAuth 認證",
      "社群事件自動推播",
      "跨平台資料同步",
    ],
  },
  {
    title: "完整社群系統",
    emoji: "👥",
    items: [
      "跨群警告紀錄管理",
      "私人頻道（Ticket）系統",
      "反應身分組角色",
      "動態語音頻道自動管理",
    ],
  },
  {
    title: "遊戲生態整合",
    emoji: "🎮",
    items: [
      "LOL 詳細戰績與時間軸分析",
      "Osu / Apex / Steam 多遊戲支援",
      "玩家資料庫綁定快查",
      "Minecraft 伺服器遠端管理",
    ],
  },
  {
    title: "智慧互動系統",
    emoji: "🤖",
    items: [
      "Google Gemini AI 對話引擎",
      "Pydantic AI Agent 搜尋工具",
      "經濟系統與賭盤投注",
      "寵物系統與 RPG 冒險",
    ],
  },
]
