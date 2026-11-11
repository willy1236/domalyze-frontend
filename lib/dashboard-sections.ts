import { dashboardFetch } from "./dashboard-api"

/** 伺服器頁的區塊；順序即側欄顯示順序，與後端 `Section` 一致。 */
export type SectionKey =
  | "notify"
  | "dynamic_voice"
  | "reaction_roles"
  | "tickets"
  | "warnings"
  | "giveaways"
  | "settings"

/** 使用者在某區塊擁有的動作；`view` 代表可以進入該區塊。 */
export interface SectionInfo {
  key: SectionKey
  actions: string[]
}

export interface SectionsResponse {
  sections: SectionInfo[]
}

export interface NavItemDef {
  key: SectionKey
  label: string
  /** 相對於 /dashboard/guilds/[id] 的路徑；通知是伺服器頁本身，所以是空字串 */
  path: string
  /** 區塊頁面完成前為 false，不出現在側欄；各區塊卡完成時改成 true */
  ready: boolean
}

export const NAV_ITEMS: readonly NavItemDef[] = [
  { key: "notify", label: "通知", path: "", ready: true },
  { key: "dynamic_voice", label: "動態語音", path: "/voice", ready: true },
  { key: "reaction_roles", label: "反應身分組", path: "/reaction-roles", ready: true },
  { key: "tickets", label: "私人頻道", path: "/tickets", ready: false },
  { key: "warnings", label: "警告", path: "/warnings", ready: true },
  { key: "giveaways", label: "抽獎", path: "/giveaways", ready: true },
  { key: "settings", label: "基本設定", path: "/settings", ready: true },
]

/** 能進入伺服器頁的權限（與後端進入條件一致），邀請完成後沒有任何一項時列給使用者看。 */
export const ENTRY_PERMISSION_LABELS = [
  "管理頻道",
  "管理身分組",
  "管理伺服器",
  "管理訊息",
  "踢出成員",
  "停權成員",
  "禁言成員",
] as const

export function sectionBasePath(guildId: string): string {
  return `/dashboard/guilds/${encodeURIComponent(guildId)}`
}

export function sectionHref(guildId: string, item: NavItemDef): string {
  return `${sectionBasePath(guildId)}${item.path}`
}

export function fetchSections(guildId: string, signal?: AbortSignal): Promise<SectionsResponse> {
  return dashboardFetch<SectionsResponse>(
    `/dashboard/guilds/${encodeURIComponent(guildId)}/sections`,
    {},
    { signal },
  )
}

/** 是否可進入區塊（有 `action` 時要求該動作）。 */
export function canAccess(sections: readonly SectionInfo[], key: SectionKey, action = "view"): boolean {
  return sections.some((s) => s.key === key && s.actions.includes(action))
}

/** 側欄要顯示的項目：已完成頁面（ready）且使用者有權限，順序同 NAV_ITEMS。 */
export function visibleNavItems(
  sections: readonly SectionInfo[],
  items: readonly NavItemDef[] = NAV_ITEMS,
): NavItemDef[] {
  return items.filter((item) => item.ready && canAccess(sections, item.key))
}

/** 第一個可進入的區塊；沒有（例如權限只涵蓋尚未完成的區塊）回 null。 */
export function firstSection(
  sections: readonly SectionInfo[],
  items: readonly NavItemDef[] = NAV_ITEMS,
): NavItemDef | null {
  return visibleNavItems(sections, items)[0] ?? null
}

export function permissionNotice(): string {
  return `星羽已加入伺服器，但你在該伺服器沒有可使用的管理權限。需要以下其中一項：${ENTRY_PERMISSION_LABELS.map((l) => `「${l}」`).join("、")}。請伺服器管理員授予權限後再進入。`
}
