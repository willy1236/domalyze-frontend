import { dashboardFetch } from "./dashboard-api"

export type GiveawayStatus = "active" | "ended"

export interface GiveawaySummary {
  id: number
  prize_name: string
  status: GiveawayStatus
  winner_count: number
  participant_count: number
  redraw_count: number
  creator_id: string
  /** 發起人已離開且不在 bot 快取時為 null */
  creator_name: string | null
  channel_id: string
  /** 抽獎訊息的連結；沒有訊息 ID 時為 null */
  message_url: string | null
  /** ISO 字串 */
  created_at: string
  /** 進行中是預計開獎時間，已結束是實際結束時間 */
  ends_at: string | null
}

export interface GiveawaysResponse {
  giveaways: GiveawaySummary[]
  page: number
  has_next: boolean
  /** 是否顯示全部（否則只列 recent_days 天內建立的已結束抽獎） */
  all: boolean
  recent_days: number
}

export interface GiveawayParticipant {
  id: string
  name: string | null
  avatar_url: string | null
  /** 已離開伺服器：只有 ID，沒有名稱與頭像 */
  left: boolean
  joined_at: string
  is_winner: boolean
}

export interface GiveawayDetail extends GiveawaySummary {
  description: string | null
  /** 頻道已不存在時為 null */
  channel_name: string | null
  participants: GiveawayParticipant[]
  winners: GiveawayParticipant[]
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/giveaways`

export function fetchGiveaways(
  guildId: string,
  opts: { all: boolean; page: number },
  signal?: AbortSignal,
): Promise<GiveawaysResponse> {
  const params = new URLSearchParams({ page: String(opts.page) })
  if (opts.all) params.set("all", "true")
  return dashboardFetch<GiveawaysResponse>(`${base(guildId)}?${params.toString()}`, {}, { signal })
}

export function fetchGiveaway(guildId: string, id: number, signal?: AbortSignal): Promise<GiveawayDetail> {
  return dashboardFetch<GiveawayDetail>(`${base(guildId)}/${id}`, {}, { signal })
}

/** 「年/月/日 時:分」，預設使用者本地時區；timeZone 讓測試能固定結果 */
export function formatDateTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso))
}

/** 參加者顯示名稱：已離開或查不到名稱時退回 ID */
export function participantLabel(p: Pick<GiveawayParticipant, "id" | "name" | "left">): string {
  if (p.name) return p.name
  return p.left ? `已離開的成員（${p.id}）` : p.id
}

export function statusLabel(status: GiveawayStatus): string {
  return status === "active" ? "進行中" : "已結束"
}
