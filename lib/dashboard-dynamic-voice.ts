import { dashboardFetch } from "./dashboard-api"

export interface PermissionIssue {
  /** 例如 "Manage Channels" */
  permission: string
  scope: "category" | "guild" | "channel"
  /** 缺少時的後果（中文） */
  consequence: string
}

export interface Lobby {
  channel: {
    id: string
    /** 頻道不存在時為 null */
    name: string | null
    /** 沒有分類為 null */
    category: string | null
    /** 頻道失效的原因；正常為 null */
    invalid: string | null
  }
  /** 資料庫的原始值，衝突比對的 original 用這個 */
  template: string | null
  /** 模板失效的原因；正常為 null */
  template_invalid: string | null
  permission_issues: PermissionIssue[]
}

export interface LobbyResponse {
  lobby: Lobby | null
}

/** 房間名稱模板留空時 bot 用的名稱 */
export const DEFAULT_ROOM_NAME_HINT = "<username>的頻道"

export function fetchLobby(guildId: string, signal?: AbortSignal): Promise<LobbyResponse> {
  return dashboardFetch<LobbyResponse>(`/dashboard/guilds/${encodeURIComponent(guildId)}/dynamic-voice`, {}, { signal })
}
