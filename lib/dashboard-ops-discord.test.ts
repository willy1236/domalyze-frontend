import { describe, expect, it } from "vitest"
import { type GuildEvent, guildEventLabel } from "./dashboard-ops-discord"

const base: GuildEvent = {
  id: 1,
  guild_id: "1",
  guild_name: "g",
  event: "join",
  member_count: 3,
  at: "2026-11-20T00:00:00+08:00",
  source: "gateway",
}

describe("guildEventLabel", () => {
  it("即時事件只顯示加入或離開", () => {
    expect(guildEventLabel(base)).toBe("加入")
    expect(guildEventLabel({ ...base, event: "leave" })).toBe("離開")
  })

  it("啟動時補記的標出來源", () => {
    expect(guildEventLabel({ ...base, source: "startup" })).toBe("加入（啟動時補記）")
    expect(guildEventLabel({ ...base, event: "leave", source: "startup" })).toBe("離開（離線期間，啟動時發現）")
  })
})
