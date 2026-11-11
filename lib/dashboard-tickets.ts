import { dashboardFetch } from "./dashboard-api"

export type TicketStatus = "open" | "locked"

/** 大廳失效的原因；同時有多項只會回第一個（頻道、分類、訊息的順序）。 */
export type LobbyInvalidReason = "channel_deleted" | "category_deleted" | "message_deleted"

/** 名稱為 null 代表已離開伺服器 */
export interface TicketMember {
  id: string
  name: string | null
}

export interface TicketItem {
  /** name 為 null 代表頻道已不存在（正常情況下載入時會移除紀錄，不會出現） */
  channel: { id: string; name: string | null }
  jump_url: string
  creator: TicketMember | null
  /** ISO 字串 */
  created_at: string
  /** 流水號；測試版建立的頻道為 null */
  number: number | null
  status: TicketStatus
  /** 只有已鎖定的有值 */
  closer: TicketMember | null
  closed_at: string | null
}

export interface ManagerRole {
  id: string
  /** 身分組已被刪除時為 null */
  name: string | null
  invalid: boolean
}

export interface TicketPermissionIssue {
  permission: string
  /** 檢查的位置：私人頻道所在的分類，或大廳頻道 */
  target: "category" | "lobby_channel"
  consequence: string
}

export interface TicketLobby {
  channel: { id: string; name: string | null; invalid: boolean }
  jump_url: string
  message_invalid: boolean
  category: { id: string | null; name: string | null; invalid: boolean }
  invalid_reason: LobbyInvalidReason | null
  manager_roles: ManagerRole[]
  name_prefix: string
  one_per_user: boolean
  /** 同時開啟上限；null 為不限 */
  max_open: number | null
  /** 所有還沒刪除的私人頻道，包括已鎖定的（都占名額） */
  ticket_count: number
  locked_count: number
  permission_issues: TicketPermissionIssue[]
  tickets: TicketItem[]
}

export interface TicketsResponse {
  lobbies: TicketLobby[]
  /** 對不到大廳的私人頻道 */
  unassigned: TicketItem[]
}

export function fetchTickets(guildId: string, signal?: AbortSignal): Promise<TicketsResponse> {
  return dashboardFetch<TicketsResponse>(`/dashboard/guilds/${encodeURIComponent(guildId)}/tickets`, {}, { signal })
}

/** 大廳失效的說明，沒有失效回 null。 */
export function lobbyInvalidMessage(reason: LobbyInvalidReason | null): string | null {
  switch (reason) {
    case "channel_deleted":
      return "大廳頻道已被刪除"
    case "category_deleted":
      return "私人頻道所在的分類已被刪除或尚未設定，必須重新選分類才能再開單"
    case "message_deleted":
      return "大廳訊息已被刪除，成員無法從大廳開單"
    default:
      return null
  }
}

/** 權限警告的位置說明。 */
export function targetLabel(target: TicketPermissionIssue["target"]): string {
  return target === "category" ? "私人頻道所在分類" : "大廳頻道"
}

/** 成員顯示文字：離開伺服器的只顯示 ID。 */
export function memberLabel(member: TicketMember | null): string {
  if (!member) return "未知"
  return member.name ?? `${member.id}（已離開伺服器）`
}

/** 開單限制的說明：每人一張與同時開啟上限。 */
export function limitSummary(lobby: Pick<TicketLobby, "one_per_user" | "max_open">): string {
  const parts = [lobby.one_per_user ? "每人一張" : "每人不限張數"]
  parts.push(lobby.max_open === null ? "不限同時開啟上限" : `同時開啟上限 ${lobby.max_open} 張`)
  return parts.join("，")
}
