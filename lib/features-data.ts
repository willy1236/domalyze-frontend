import {
  Shield,
  Bell,
  Tv,
  Music,
  Trophy,
  Users,
  Coins,
  Vote,
  MessageSquare,
  Pickaxe,
} from "lucide-react"

export const FEATURES_DATA = [
  {
    icon: Shield,
    title: "跨群警告",
    description:
      "違規紀錄跨伺服器共用。成員加入時，管理頻道即顯示其於其他伺服器累積的紀錄筆數。",
  },
  {
    icon: Bell,
    title: "地震與天氣",
    description:
      "地震報告每 3 分鐘更新，天氣警特報每 15 分鐘檢查，資料取自中央氣象署 API。",
    color: "text-orange-500",
  },
  {
    icon: Tv,
    title: "開台推播",
    description:
      "Twitch 開台、新影片與新剪輯，以及 YouTube 與 X 的更新，各自指定發送頻道與標註身分組。",
  },
  {
    icon: Music,
    title: "音樂與歌單",
    description:
      "播放、佇列、循環與隨機。歌單綁定於雲端帳號，更換 Discord 帳號後仍可存取。",
  },
  {
    icon: Trophy,
    title: "遊戲查詢",
    description:
      "LOL、Osu、Apex、Dead by Daylight、Steam 與 Minecraft，帳號綁定一次即可長期查詢。",
  },
  {
    icon: Users,
    title: "頻道與身分組",
    description:
      "動態語音房閒置後自動回收，Ticket 私人頻道即時開設，身分組由成員自助領取。",
  },
  {
    icon: Coins,
    title: "星塵經濟",
    description:
      "⭐星塵、PT 點數與 Rcoin 三種貨幣，支援餘額查詢與相互轉帳。",
  },
  {
    icon: Vote,
    title: "投票與抽獎",
    description:
      "投票可限定參加身分組，抽獎自動開獎；服務重新啟動後，進行中的活動會自動恢復。",
    color: "text-red-500",
  },
  {
    icon: MessageSquare,
    title: "Twitch 聊天室",
    description:
      "自訂聊天指令、追隨與訂閱事件、頻道點數兌換。開台訊息同步發送至 Discord。",
    color: "text-indigo-500",
  },
  {
    icon: Pickaxe,
    title: "Minecraft",
    description:
      "查詢任意伺服器的線上狀態；白名單伺服器另可透過面板開關機並取得連線位址。",
    color: "text-emerald-500",
  },
]

export const CORE_ADVANTAGES = [
  {
    title: "四個平台，一套後台",
    emoji: "🌐",
    items: [
      "Discord、Twitch、LINE 與 Web API 共用同一份資料",
      "支援 Discord、Twitch、Google 三種 OAuth 綁定",
      "以 Discord 授權時，已連結的 Twitch 帳號自動帶入",
      "開台訊息同步發送至 Twitch 聊天室與 Discord 通知頻道",
    ],
  },
  {
    title: "完整的版務工具",
    emoji: "👥",
    items: [
      "警告紀錄可選擇僅留本群，或同步至跨群系統",
      "Ticket 私人頻道關閉時僅鎖定權限，完整保留對話",
      "12 種通知類型各自指定頻道、身分組與訊息內容",
      "設定動態語音房時，逐項回報尚缺的權限",
    ],
  },
  {
    title: "為遊戲社群而生",
    emoji: "🎮",
    items: [
      "LOL 提供對戰時間軸，以及近 20 場所有對手的牌位分布",
      "指定日期的 LOL 職業賽事結果，資料取自 Leaguepedia",
      "Radmin VPN、ZeroTier 與 NetBird 三種內網自助登記",
      "Minecraft 面板可遠端開關機，並同時回傳兩組 VPN 位址",
    ],
  },
  {
    title: "開發中的項目",
    emoji: "✦",
    items: [
      "寵物認養系統，目前提供 7 種物種",
      "擲骰、抽卡與語音頻道隨機抽選",
      "RPG 冒險系統於指定伺服器測試中",
      "語音錄製為實驗性功能",
    ],
  },
]
