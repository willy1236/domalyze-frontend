import { describe, expect, it } from "vitest"
import { CHANNEL_NAV, channelSectionHref, isChannelSectionActive } from "./dashboard-channel-sections"

const item = (key: string) => CHANNEL_NAV.find((i) => i.key === key)!

describe("CHANNEL_NAV", () => {
  it("包含總覽、指令、計時訊息、事件回應、轉發 Discord、修改紀錄、設定", () => {
    const others = CHANNEL_NAV.filter((i) => !["regulars", "moderation", "enforcement"].includes(i.key) && i.label !== "實況資訊")
    expect(others.map((i) => i.label)).toEqual([
      "總覽",
      "指令",
      "計時訊息",
      "事件回應",
      "轉發 Discord",
      "修改紀錄",
      "設定",
    ])
  })
})

it("常客有自己的頻道導覽入口", () => {
  const regulars = item("regulars")
  expect(regulars?.label).toBe("常客")
  expect(channelSectionHref("7", regulars)).toBe("/dashboard/twitch/7/regulars")
})

it("聊天室管理有自己的頻道導覽入口", () => {
  const moderation = item("moderation")
  expect(moderation?.label).toBe("聊天室管理")
  expect(channelSectionHref("7", moderation)).toBe("/dashboard/twitch/7/moderation")
})

it("執法紀錄有自己的頻道導覽入口", () => {
  const enforcement = item("enforcement")
  expect(enforcement?.label).toBe("執法紀錄")
  expect(channelSectionHref("7", enforcement)).toBe("/dashboard/twitch/7/enforcement")
})

it("實況資訊有自己的頻道導覽入口", () => {
  const stream = CHANNEL_NAV.find((i) => i.label === "實況資訊")
  expect(stream, "CHANNEL_NAV 缺「實況資訊」").toBeDefined()
  expect(channelSectionHref("7", stream!)).toBe("/dashboard/twitch/7/stream")
})

describe("channelSectionHref", () => {
  it("總覽是頻道頁本身，其他區塊接上子路徑", () => {
    expect(channelSectionHref("7", item("overview"))).toBe("/dashboard/twitch/7")
    expect(channelSectionHref("7", item("commands"))).toBe("/dashboard/twitch/7/commands")
  })
})

describe("isChannelSectionActive", () => {
  it("總覽只在網址完全相符時算所在位置", () => {
    expect(isChannelSectionActive("7", item("overview"), "/dashboard/twitch/7")).toBe(true)
    expect(isChannelSectionActive("7", item("overview"), "/dashboard/twitch/7/commands")).toBe(false)
  })
  it("其他區塊含子路徑", () => {
    expect(isChannelSectionActive("7", item("commands"), "/dashboard/twitch/7/commands")).toBe(true)
    expect(isChannelSectionActive("7", item("commands"), "/dashboard/twitch/7/timers")).toBe(false)
  })
})
