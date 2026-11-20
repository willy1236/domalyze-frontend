import { beforeEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import {
  channelsOf,
  describeSetting,
  fetchForward,
  fetchForwardOptions,
  forwardProblemMessage,
  isDirty,
  parseForwardProblem,
  saveForward,
  valuesOf,
} from "./dashboard-channel-forward"

vi.mock("./dashboard-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./dashboard-api")>()),
  dashboardFetch: vi.fn().mockResolvedValue({}),
}))

const guilds = [
  { id: "1", name: "甲", icon_url: null, channels: [{ id: "11", name: "general", type: "text" }] },
  { id: "2", name: "乙", icon_url: null, channels: [] },
]

describe("API", () => {
  beforeEach(() => vi.mocked(dashboardFetch).mockClear())

  it("讀取設定與選項", async () => {
    await fetchForward("7")
    await fetchForwardOptions("7")
    expect(vi.mocked(dashboardFetch).mock.calls.map((c) => c[0])).toEqual([
      "/dashboard/channels/7/forward",
      "/dashboard/channels/7/forward/options",
    ])
  })

  it("儲存：PUT 字串 id（超過 2^53 不失真）；沒選頻道就是清除", async () => {
    const guildId = "566533708371329026"
    const channelId = "566533708371329027"
    await saveForward("7", { guildId, channelId })
    await saveForward("7", { guildId, channelId: null })
    const calls = vi.mocked(dashboardFetch).mock.calls
    expect(calls[0]).toEqual(["/dashboard/channels/7/forward", { method: "PUT", json: { guild_id: guildId, channel_id: channelId } }])
    expect(calls[1][1]).toEqual({ method: "PUT", json: { guild_id: null, channel_id: null } })
  })
})

describe("表單轉換", () => {
  it("valuesOf、isDirty", () => {
    const setting = { editable: true, guild: { id: "1", name: "甲" }, channel: { id: "11", name: "general" } }
    const base = valuesOf(setting)
    expect(base).toEqual({ guildId: "1", channelId: "11" })
    expect(isDirty(base, base)).toBe(false)
    expect(isDirty(base, { guildId: "1", channelId: null })).toBe(true)
    expect(valuesOf({ editable: true, guild: null, channel: null })).toEqual({ guildId: null, channelId: null })
  })

  it("channelsOf 只回該伺服器的頻道", () => {
    expect(channelsOf(guilds, "1")).toHaveLength(1)
    expect(channelsOf(guilds, "2")).toEqual([])
    expect(channelsOf(guilds, null)).toEqual([])
    expect(channelsOf(guilds, "9")).toEqual([])
  })

  it("describeSetting：名稱查不到時顯示 id，沒設定為 null", () => {
    expect(describeSetting({ guild: { id: "1", name: "甲" }, channel: { id: "11", name: "general" } })).toBe("甲 / # general")
    expect(describeSetting({ guild: { id: "1", name: null }, channel: { id: "11", name: null } })).toBe("1 / # 11")
    expect(describeSetting({ guild: null, channel: { id: "11", name: "x" } })).toBe("# x")
    expect(describeSetting({ guild: null, channel: null })).toBeNull()
  })
})

describe("parseForwardProblem", () => {
  const err = (code: string | null) => new DashboardApiError(403, code, null, false)

  it.each([
    ["forward_forbidden", "forbidden"],
    ["forward_not_allowed", "not_allowed"],
    ["invalid_channel", "invalid_channel"],
    ["bot_not_in_guild", "bot_missing"],
    ["bot_unavailable", "unavailable"],
    ["guild_unavailable", "unavailable"],
  ])("%s -> %s", (code, kind) => {
    const problem = parseForwardProblem(err(code))
    expect(problem?.kind).toBe(kind)
    expect(forwardProblemMessage(problem!)).not.toBe("")
  })

  it("其他錯誤回 null", () => {
    expect(parseForwardProblem(err("conflict"))).toBeNull()
    expect(parseForwardProblem(new Error("x"))).toBeNull()
  })
})
