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
