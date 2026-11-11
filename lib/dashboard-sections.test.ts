import { describe, expect, it } from "vitest"
import {
  ENTRY_PERMISSION_LABELS,
  NAV_ITEMS,
  canAccess,
  firstSection,
  permissionNotice,
  sectionHref,
  visibleNavItems,
  type NavItemDef,
  type SectionInfo,
} from "./dashboard-sections"

const allReady: NavItemDef[] = NAV_ITEMS.map((i) => ({ ...i, ready: true }))

const banOnly: SectionInfo[] = [{ key: "warnings", actions: ["view", "remove", "ban"] }]
const rolesOnly: SectionInfo[] = [
  { key: "reaction_roles", actions: ["view"] },
  { key: "warnings", actions: ["view"] },
]
const manageChannels: SectionInfo[] = [
  { key: "notify", actions: ["view"] },
  { key: "dynamic_voice", actions: ["view"] },
  { key: "tickets", actions: ["view"] },
  { key: "warnings", actions: ["view"] },
]

describe("NAV_ITEMS", () => {
  it("七個區塊，順序同後端 Section", () => {
    expect(NAV_ITEMS.map((i) => i.key)).toEqual([
      "notify",
      "dynamic_voice",
      "reaction_roles",
      "tickets",
      "warnings",
      "giveaways",
      "settings",
    ])
  })

  it("目前完成頁面的區塊", () => {
    expect(NAV_ITEMS.filter((i) => i.ready).map((i) => i.key)).toEqual(["notify", "dynamic_voice", "reaction_roles", "warnings", "giveaways"])
  })
})

describe("canAccess", () => {
  it("要求區塊與動作都有", () => {
    expect(canAccess(banOnly, "warnings")).toBe(true)
    expect(canAccess(banOnly, "warnings", "ban")).toBe(true)
    expect(canAccess(banOnly, "warnings", "kick")).toBe(false)
    expect(canAccess(banOnly, "notify")).toBe(false)
  })
})

describe("visibleNavItems", () => {
  it("只有 Ban：側欄只有警告", () => {
    expect(visibleNavItems(banOnly).map((i) => i.key)).toEqual(["warnings"])
  })

  it("只有 Manage Roles：反應身分組與警告，沒有通知與動態語音", () => {
    expect(visibleNavItems(rolesOnly, allReady).map((i) => i.key)).toEqual(["reaction_roles", "warnings"])
  })

  it("ready 為 false 的區塊即使有權限也不顯示", () => {
    expect(visibleNavItems(manageChannels).map((i) => i.key)).toEqual(["notify", "dynamic_voice", "warnings"])
  })
})

describe("firstSection", () => {
  it("有 Manage Channels 停在通知", () => {
    expect(firstSection(manageChannels)?.key).toBe("notify")
  })

  it("只有 Manage Roles 停在反應身分組", () => {
    expect(firstSection(rolesOnly, allReady)?.key).toBe("reaction_roles")
  })

  it("只有 Ban 停在警告", () => {
    expect(firstSection(banOnly)?.key).toBe("warnings")
  })

  it("權限只涵蓋尚未完成的區塊時回 null", () => {
    expect(firstSection([{ key: "tickets", actions: ["view"] }])).toBeNull()
  })

  it("沒有任何區塊回 null", () => {
    expect(firstSection([], allReady)).toBeNull()
  })
})

describe("sectionHref", () => {
  it("通知是伺服器頁本身，其他區塊接子路徑", () => {
    expect(sectionHref("123", NAV_ITEMS[0])).toBe("/dashboard/guilds/123")
    expect(sectionHref("123", NAV_ITEMS[1])).toBe("/dashboard/guilds/123/voice")
  })
})

describe("permissionNotice", () => {
  it("列出全部可進入的權限", () => {
    const text = permissionNotice()
    for (const label of ENTRY_PERMISSION_LABELS) expect(text).toContain(`「${label}」`)
  })
})
