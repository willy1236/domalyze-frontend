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
  Network,
  ShieldCheck,
  Gamepad2,
  FlaskConical,
} from "lucide-react"

export const FEATURES_DATA = [
  {
    icon: Shield,
    title: "跨群警告",
    description:
      "違規紀錄可跨伺服器共用。成員加入時，加入日誌頻道會顯示他累積的跨群警告筆數。",
  },
  {
    icon: Bell,
    title: "地震與天氣",
    description:
      "地震報告每 3 分鐘更新，天氣警特報每 15 分鐘檢查，資料取自中央氣象署 API。",
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
      "LOL、osu!、Apex、Dead by Daylight 與 Steam 的玩家資料查詢。",
  },
  {
    icon: Users,
    title: "頻道與身分組",
    description:
      "動態語音房無人時自動回收，Ticket 私人頻道即時開設，身分組由成員自助領取。",
  },
  {
    icon: Coins,
    title: "星塵經濟",
    description:
      "星塵、PT 點數與 Rcoin 三種貨幣，可查詢餘額，星塵另可於成員間轉帳。",
  },
  {
    icon: Vote,
    title: "投票與抽獎",
    description:
      "投票可限定參加身分組，抽獎自動開獎；服務重新啟動後，進行中的活動會自動恢復。",
  },
  {
    icon: MessageSquare,
    title: "Twitch 聊天室",
    description:
      "自訂聊天指令、追隨與訂閱事件、頻道點數兌換。開台訊息同步發送至 Discord。",
  },
  {
    icon: Pickaxe,
    title: "Minecraft",
    description:
      "合作伺服器限定：查詢 Minecraft 伺服器狀態，並透過面板開關機與取得連線位址。",
  },
]

export const CORE_ADVANTAGES = [
  {
    title: "不只在 Discord",
    icon: Network,
    items: [
      "Twitch 聊天室自訂指令、追隨與訂閱事件、頻道點數兌換",
      "開台訊息同步發送至 Twitch 聊天室與 Discord 通知頻道",
      "LINE 上可傳網址給星羽，取得風險檢查報告",
      "歌單綁定於雲端帳號，更換 Discord 帳號後仍可存取",
    ],
  },
  {
    title: "完整的版務工具",
    icon: ShieldCheck,
    items: [
      "警告紀錄可選擇僅留本群，或同步至跨群系統",
      "Ticket 私人頻道關閉時僅鎖定權限，完整保留對話",
      "12 種頻道通知與 5 種社群推播，各自指定發送頻道",
      "設定動態語音房時，逐項回報尚缺的權限",
    ],
  },
  {
    title: "為遊戲社群而生",
    icon: Gamepad2,
    items: [
      "LOL 統計最近對戰中所有玩家的牌位分布",
      "指定日期的 LOL 職業賽事結果，資料取自 Leaguepedia",
      "Radmin VPN、ZeroTier 與 NetBird 三種內網自助登記",
      "Minecraft 面板可遠端開關機，並同時回傳兩組 VPN 位址",
    ],
  },
  {
    title: "開發中",
    icon: FlaskConical,
    items: [
      "寵物認養系統，目前提供 7 種物種",
      "擲骰、抽卡與語音頻道隨機抽選",
      "RPG 冒險系統於指定伺服器測試中",
      "語音錄製：Discord 語音加密尚未相容，暫停中",
    ],
  },
]
