import { dashboardFetch } from "./dashboard-api"

export interface DynamicRoom {
  id: string
  name: string
  member_count: number
  /** ISO 字串 */
  created_at: string
  /** 建立者已離開伺服器時為 null */
  creator: { name: string; avatar_url: string } | null
}

export interface RoomsResponse {
  rooms: DynamicRoom[]
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/dynamic-voice/rooms`

export function fetchRooms(guildId: string, signal?: AbortSignal): Promise<RoomsResponse> {
  return dashboardFetch<RoomsResponse>(base(guildId), {}, { signal })
}

export interface ClearResult {
  id: string
  /** 不是動態房間的 id 沒有名稱 */
  name: string | null
  /** cleared：已清除（含頻道已不存在）；skipped_occupied：執行當下有人進入，已跳過；failed：刪不掉，reason 說明 */
  status: "cleared" | "skipped_occupied" | "failed"
  reason?: string
}

/** 清除這些房間；有人的房間後端會逐筆跳過，整個請求仍成功。 */
export async function clearRooms(guildId: string, channelIds: string[]): Promise<ClearResult[]> {
  const res = await dashboardFetch<{ results: ClearResult[] }>(`${base(guildId)}/clear`, {
    method: "POST",
    json: { channel_ids: channelIds },
  })
  return res.results
}

/** 人數為 0 的房間才能清除 */
export const isEmptyRoom = (room: DynamicRoom) => room.member_count === 0

/** 「月/日 時:分」，預設使用者本地時區；timeZone 讓測試能固定結果 */
export function formatCreatedAt(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso))
}
