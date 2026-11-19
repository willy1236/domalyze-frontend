// 頻道後台的「最近被擋下的訊息」：bot 發言前被頻道 AutoMod 擋下，或檢查失敗而沒送出的訊息。

import { dashboardFetch } from "./dashboard-api"

export type BlockSourceKind = "command" | "timer" | "event_response"
export type BlockReason = "automod" | "check_failed"

export interface AutomodBlock {
  id: number
  /** ISO 時間 */
  at: string
  source_kind: BlockSourceKind
  /** 指令名稱、計時訊息編號或事件種類 */
  source_key: string
  text: string
  reason: BlockReason
}

export function fetchAutomodBlocks(channelId: string, signal?: AbortSignal): Promise<{ blocks: AutomodBlock[] }> {
  return dashboardFetch(`/dashboard/channels/${encodeURIComponent(channelId)}/automod-blocks`, {}, { signal })
}

const EVENT_LABELS: Record<string, string> = {
  stream_online: "開台",
  follow: "追隨",
  subscribe: "訂閱",
  resubscribe: "續訂",
  gift: "贈訂",
  raid: "Raid",
}

/** 來源的顯示文字：指令顯示名稱，計時訊息沒有名稱，事件顯示種類 */
export function blockSourceLabel(block: Pick<AutomodBlock, "source_kind" | "source_key">): string {
  switch (block.source_kind) {
    case "command":
      return `指令 !${block.source_key}`
    case "timer":
      return "計時訊息"
    case "event_response":
      return `事件回應：${EVENT_LABELS[block.source_key] ?? block.source_key}`
  }
}

export function blockReasonLabel(reason: BlockReason): string {
  return reason === "automod" ? "被 AutoMod 擋下" : "AutoMod 檢查失敗，沒有送出"
}
