// 公開頁與公開設定：型別、API 呼叫與區塊組裝。

import { DashboardApiError, dashboardFetch } from "./dashboard-api"

export type SectionKey = "points" | "pets" | "voice" | "participation" | "playlists" | "discord_names"

/** 可勾選的區塊，順序同公開頁；警告、雲端資料夾共用與 NetBird 永遠不公開，不在清單內 */
export const SECTION_OPTIONS: { key: SectionKey; label: string }[] = [
  { key: "points", label: "積分" },
  { key: "pets", label: "寵物" },
  { key: "voice", label: "語音時數（只顯示總時數）" },
  { key: "participation", label: "投票、賭盤、抽獎參與次數" },
  { key: "playlists", label: "歌單" },
  { key: "discord_names", label: "Discord 頭像與名稱" },
]

export type PublicSettings =
  | { available: false }
  | { available: true; enabled: boolean; sections: SectionKey[]; username: string | null }

export interface PublicDiscord {
  /** 「帳號一」「帳號二」，依 Discord ID 由小到大 */
  label: string
  name?: string | null
  avatar_url?: string | null
  points?: { stardust: number; point: number; rcoin: number }
  pet?: { name: string; species: string } | null
  voice_minutes?: number
  participation?: { polls: number; bets: number; giveaways: number }
}

export interface PublicProfile {
  username: string
  sections: SectionKey[]
  discords: PublicDiscord[]
  playlists: { name: string; songs: { title: string; url: string }[] }[] | null
}

export type PublicResult =
  | { kind: "ok"; profile: PublicProfile }
  | { kind: "not_found" }
  | { kind: "unavailable" }

export function publicPath(username: string): string {
  return `/u/${encodeURIComponent(username)}`
}

/** 勾選或取消一個區塊，結果依固定順序排列 */
export function toggleSection(sections: SectionKey[], key: SectionKey, on: boolean): SectionKey[] {
  const next = new Set(sections)
  if (on) next.add(key)
  else next.delete(key)
  return SECTION_OPTIONS.map((o) => o.key).filter((k) => next.has(k))
}

export function saveSettings(enabled: boolean, sections: SectionKey[]): Promise<PublicSettings> {
  return dashboardFetch<PublicSettings>("/dashboard/personal/public", { method: "PUT", json: { enabled, sections } })
}

/** 公開頁資料：404 與 503 各自回報，其他錯誤（網路、非預期的回應）往外丟 */
export async function fetchPublicProfile(username: string, signal?: AbortSignal): Promise<PublicResult> {
  try {
    const profile = await dashboardFetch<PublicProfile>(`/dashboard/public/${encodeURIComponent(username)}`, {}, { signal })
    return { kind: "ok", profile }
  } catch (e) {
    if (e instanceof DashboardApiError) {
      if (e.code === "not_found") return { kind: "not_found" }
      if (e.code === "directory_unavailable") return { kind: "unavailable" }
    }
    throw e
  }
}

/** 語音總分鐘數顯示成「X 小時 Y 分」 */
export function formatMinutes(total: number): string {
  return `${Math.floor(total / 60)} 小時 ${total % 60} 分`
}

export type PublicBlock =
  | { key: "points" | "pets" | "voice" | "participation"; title: string; rows: { who: string; value: string }[] }
  | { key: "playlists"; title: string; playlists: NonNullable<PublicProfile["playlists"]> }

/** 各 Discord 的稱呼：有公開名稱用名稱，否則用「帳號一」 */
export function discordLabel(d: PublicDiscord): string {
  return d.name ?? d.label
}

/** 依公開頁回應組出要顯示的區塊（只有被勾選且有資料欄位的），discord_names 不是區塊，只影響稱呼 */
export function buildBlocks(profile: PublicProfile): PublicBlock[] {
  const blocks: PublicBlock[] = []
  const rows = (pick: (d: PublicDiscord) => string | null) =>
    profile.discords.flatMap((d) => {
      const value = pick(d)
      return value === null ? [] : [{ who: discordLabel(d), value }]
    })
  for (const key of profile.sections) {
    if (key === "points") {
      blocks.push({
        key,
        title: "積分",
        rows: rows((d) =>
          d.points
            ? `⭐星塵 ${d.points.stardust.toLocaleString("zh-TW")}・PT點數 ${d.points.point.toLocaleString("zh-TW")}・Rcoin ${d.points.rcoin.toLocaleString("zh-TW")}`
            : null,
        ),
      })
    } else if (key === "pets") {
      blocks.push({ key, title: "寵物", rows: rows((d) => (d.pet === undefined ? null : d.pet ? `${d.pet.name}（${d.pet.species}）` : "沒有寵物")) })
    } else if (key === "voice") {
      blocks.push({ key, title: "語音時數", rows: rows((d) => (d.voice_minutes === undefined ? null : formatMinutes(d.voice_minutes))) })
    } else if (key === "participation") {
      blocks.push({
        key,
        title: "參與次數",
        rows: rows((d) => (d.participation ? `投票 ${d.participation.polls}・賭盤 ${d.participation.bets}・抽獎 ${d.participation.giveaways}` : null)),
      })
    } else if (key === "playlists" && profile.playlists) {
      blocks.push({ key, title: "歌單", playlists: profile.playlists })
    }
  }
  return blocks
}

/** 公開頁是否沒有任何可顯示的內容（只有代號與「沒有公開的內容」） */
export function hasNoContent(profile: PublicProfile): boolean {
  return buildBlocks(profile).length === 0 && !profile.sections.includes("discord_names")
}
