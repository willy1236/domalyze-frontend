// bot owner 營運入口的網站部分：每週析域帳號連結率與連結入口點擊。

import { dashboardFetch } from "./dashboard-api"

export const OPS_WEBSITE_PATH = "/dashboard/ops/website"

export interface WeekStats {
  /** 該週週一，YYYY-MM-DD，台灣時間 */
  week_start: string
  accounts: number
  linked: number
  /** 還沒向 auth server 查的帳號數；大於 0 時該週尚未結算（本週一定是） */
  pending: number
  clicks: number
  /** 尚未結算或沒有帳號時為 null */
  rate: number | null
}

export const WEEK_RANGES = [8, 26, 52] as const

export function fetchWebsiteWeeks(weeks: number, signal?: AbortSignal): Promise<{ weeks: WeekStats[] }> {
  return dashboardFetch(`/dashboard/ops/website?weeks=${weeks}`, {}, { signal })
}

export function formatRate(week: WeekStats): string {
  return week.rate === null ? "-" : `${Math.round(week.rate * 100)}%`
}
