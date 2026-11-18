import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export interface PollActionResult {
  status: "ok" | "already_ended" | "already_deleted"
  message_failure: string | null
  message_failure_text: string | null
}

export type PollActionKind = "end" | "delete"

const base = (guildId: string, pollId: number) =>
  `/dashboard/guilds/${encodeURIComponent(guildId)}/polls/${pollId}`

export function endPoll(guildId: string, pollId: number): Promise<PollActionResult> {
  return dashboardFetch<PollActionResult>(`${base(guildId, pollId)}/end`, { method: "POST" })
}

export function deletePoll(guildId: string, pollId: number): Promise<PollActionResult> {
  return dashboardFetch<PollActionResult>(base(guildId, pollId), { method: "DELETE" })
}

/** 操作失敗時給使用者看的文字 */
export function pollActionErrorText(error: unknown): string {
  if (error instanceof DashboardApiError) {
    if (error.code === "not_poll_manager") return "只有發起人能結算或刪除這個投票。"
    if (error.status === 404) return "找不到這個投票。"
  }
  return "操作失敗，請稍後再試。"
}

/** 操作成功後的提示；訊息沒有更新或刪除時附上原因 */
export function pollActionResultText(kind: PollActionKind, result: PollActionResult): string {
  const failure = result.message_failure_text
  if (result.status === "already_ended") return "這個投票已經結算，下方是最新的結果。"
  if (result.status === "already_deleted") return "這個投票已經刪除。"
  if (kind === "end") return failure ? `已結算，但${failure}。` : "已結算並更新投票訊息。"
  return failure ? `已刪除投票資料，但${failure}。` : "已刪除投票與投票訊息。"
}
