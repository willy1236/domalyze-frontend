// 頻道的權限問題與暫停的功能：後端 channel_health 的回傳型別、文案與判斷。

import { type ChannelState, channelStatusLabel } from "./dashboard-channel"

/** 後端的功能代碼；對照表在 XingyuBot 的 starServer/dashboard/channel_health.py */
export const FEATURE_NAMES = {
  speech: "自訂指令與計時訊息",
  stream_online_response: "開台回應",
  raid_response: "Raid 回應",
  follow_response: "追隨回應",
  follow_forward: "追隨轉發",
  subscribe_response: "訂閱回應",
  subscribe_forward: "訂閱轉發",
  resubscribe_response: "續訂回應",
  resubscribe_forward: "續訂轉發",
  gift_response: "贈訂回應",
  gift_forward: "贈訂轉發",
  redemption_forward: "兌換轉發",
  prediction_forward: "預測轉發",
} as const

export type ChannelFeature = keyof typeof FEATURE_NAMES

/** 後端 issues 代碼對應的標題與說明 */
export const ISSUE_TEXTS = {
  token_invalid: {
    title: "授權已失效",
    body: "星羽沒有你頻道的有效授權，需要授權的功能都已暫停。按「修復」重新授權。",
  },
  not_mod: {
    title: "bot 不是 mod",
    body: "星羽不是這個頻道的 mod，需要 mod 的功能已暫停。按「修復」讓星羽重新成為 mod。",
  },
  bot_banned: {
    title: "星羽被封鎖或 ban",
    body: "請先在 Twitch 解除對星羽的封鎖或 ban，再按「修復」補設 mod 並重新訂閱事件。",
  },
  not_joined: {
    title: "星羽不在聊天室",
    body: "星羽沒有在你的聊天室裡，聊天室的回應已暫停。按「修復」讓星羽重新加入。",
  },
  subscription_failed: {
    title: "部分事件沒有訂閱成功",
    body: "有些事件沒有訂閱成功，相關功能已暫停。按「修復」重新訂閱。",
  },
  bot_offline: {
    title: "bot 暫時離線",
    body: "星羽暫時離線，上線後自動生效，不需要處理。",
  },
} as const

export type ChannelIssue = keyof typeof ISSUE_TEXTS

export type ChannelHealthState = "inactive" | "enabled" | "partial" | "disabled" | "banned"

export interface ChannelHealth {
  state: ChannelHealthState
  issues: ChannelIssue[]
  paused_features: ChannelFeature[]
}

/** 有問題要實況主處理：只有 bot 離線時不需要，上線後會自動恢復 */
export function needsRepair(issues: readonly ChannelIssue[]): boolean {
  return issues.some((issue) => issue !== "bot_offline")
}

/** 暫停功能的名稱；不認得的代碼（後端新增、前端還沒更新）直接顯示代碼 */
export function pausedFeatureNames(features: readonly string[]): string[] {
  return features.map((code) => (Object.hasOwn(FEATURE_NAMES, code) ? FEATURE_NAMES[code as ChannelFeature] : code))
}

/** 問題的標題與說明；不認得的代碼用代碼當標題 */
export function issueText(issue: string): { title: string; body: string } {
  return Object.hasOwn(ISSUE_TEXTS, issue) ? ISSUE_TEXTS[issue as ChannelIssue] : { title: issue, body: "" }
}

/** 狀態標籤：有功能因權限暫停時是「部分暫停」，其餘依 DB 的 state */
export function healthStatusLabel(state: ChannelState, health?: ChannelHealth): string {
  return health?.state === "partial" ? "星羽部分暫停" : channelStatusLabel(state)
}
