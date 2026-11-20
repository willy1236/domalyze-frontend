import { describe, expect, it } from "vitest"
import { type GuildEvent, discordUserUrl, guildEventLabel } from "./dashboard-ops-discord"

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
  it("不論來源只顯示加入或離開", () => {
    expect(guildEventLabel(base)).toBe("加入")
    expect(guildEventLabel({ ...base, event: "leave", source: "startup" })).toBe("離開")
  })
})

describe("discordUserUrl", () => {
  it("連到 Discord 個人資料頁", () => {
    expect(discordUserUrl("419131103836635136")).toBe("https://discord.com/users/419131103836635136")
  })
})
