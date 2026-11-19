import { describe, expect, it } from "vitest"
import { CHANNEL_NAV, channelSectionHref, isChannelSectionActive } from "./dashboard-channel-sections"

const item = (key: string) => CHANNEL_NAV.find((i) => i.key === key)!

describe("CHANNEL_NAV", () => {
  it("包含總覽、指令、計時訊息、事件回應、轉發 Discord、設定", () => {
    expect(CHANNEL_NAV.map((i) => i.label)).toEqual(["總覽", "指令", "計時訊息", "事件回應", "轉發 Discord", "設定"])
  })
})

describe("channelSectionHref", () => {
  it("總覽是頻道頁本身，其他區塊接上子路徑", () => {
    expect(channelSectionHref("7", item("overview"))).toBe("/dashboard/channels/7")
    expect(channelSectionHref("7", item("commands"))).toBe("/dashboard/channels/7/commands")
  })
})

describe("isChannelSectionActive", () => {
  it("總覽只在網址完全相符時算所在位置", () => {
    expect(isChannelSectionActive("7", item("overview"), "/dashboard/channels/7")).toBe(true)
    expect(isChannelSectionActive("7", item("overview"), "/dashboard/channels/7/commands")).toBe(false)
  })
  it("其他區塊含子路徑", () => {
    expect(isChannelSectionActive("7", item("commands"), "/dashboard/channels/7/commands")).toBe(true)
    expect(isChannelSectionActive("7", item("commands"), "/dashboard/channels/7/timers")).toBe(false)
  })
})
