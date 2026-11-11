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
  /** 發起人已離開伺服器時為 null */
  creator_name: string | null
  channel_id: string
  /** 頻道已不存在時為 null */
  channel_name: string | null
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

/** 參加者顯示名稱：已離開優先標示；否則用名稱，再退回 ID */
export function participantLabel(p: Pick<GiveawayParticipant, "id" | "name" | "left">): string {
  if (p.left) return `已離開的成員（${p.id}）`
  return p.name || p.id
}

export function statusLabel(status: GiveawayStatus): string {
  return status === "active" ? "進行中" : "已結束"
}

/** 提前結束與重抽的結果：抽獎本身已處理，announce_failure 不為 null 代表原頻道沒有公告 */
export interface GiveawayActionResult {
  /** ok：已處理；already_ended：執行當下抽獎已經結束（剛好到期或發起人剛按下），視為成功 */
  status: "ok" | "already_ended"
  announce_failure: "channel_missing" | "no_permission" | "failed" | null
  announce_failure_text: string | null
  /** 重抽時沒抽出新中獎者（沒有可替補的參加者） */
  no_replacement: boolean
}

export function endGiveaway(guildId: string, id: number): Promise<GiveawayActionResult> {
  return dashboardFetch<GiveawayActionResult>(`${base(guildId)}/${id}/end`, { method: "POST" })
}

/** winnerUserId 省略為整批重抽；指定時取消該中獎者的資格並抽出替補（已離開的中獎者也可以） */
export function redrawGiveaway(guildId: string, id: number, winnerUserId?: string): Promise<GiveawayActionResult> {
  return dashboardFetch<GiveawayActionResult>(`${base(guildId)}/${id}/redraw`, {
    method: "POST",
    json: winnerUserId ? { winner_user_id: winnerUserId } : {},
  })
}

const ACTION_ERRORS: Record<string, string> = {
  giveaway_not_found: "找不到這個抽獎。",
  giveaway_not_ended: "這個抽獎尚未結束，不能重抽。",
  not_winner: "這位成員已經不是中獎者，請重新整理後再試。",
  not_participant: "這位成員沒有參加這個抽獎。",
}

/** 操作失敗時給使用者看的文字 */
export function actionErrorText(code: string | null): string {
  return (code && ACTION_ERRORS[code]) || "操作失敗，請稍後再試。"
}

/** 操作成功後的提示（含沒有公告的原因、重抽沒有替補） */
export function actionResultText(kind: "end" | "redraw", result: GiveawayActionResult): string {
  if (result.status === "already_ended") return "這個抽獎已經結束，下方是最新的結果。"
  if (kind === "redraw" && result.no_replacement) {
    const base = "已重抽，但沒有可替補的參加者。"
    return result.announce_failure_text ? `${base}且${result.announce_failure_text}。` : base
  }
  const base = kind === "end" ? "已提前結束並開獎。" : "已重抽。"
  return result.announce_failure_text ? `${base}但${result.announce_failure_text}。` : `${base}已在原頻道公告。`
}
