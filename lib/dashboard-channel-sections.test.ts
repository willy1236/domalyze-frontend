import { describe, expect, it } from "vitest"
import { CHANNEL_NAV, channelSectionHref, isChannelSectionActive } from "./dashboard-channel-sections"

const item = (key: string) => CHANNEL_NAV.find((i) => i.key === key)!

describe("CHANNEL_NAV", () => {
  it("包含總覽、指令、計時訊息、事件回應、轉發 Discord、修改紀錄、設定", () => {
    expect(CHANNEL_NAV.filter((i) => !["regulars", "moderation"].includes(i.key)).map((i) => i.label)).toEqual([
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
