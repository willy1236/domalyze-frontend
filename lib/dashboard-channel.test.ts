import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  type ChannelInfo,
  channelListView,
  channelPath,
  channelStatusLabel,
  forwardAccessNotice,
  isChannelForbidden,
} from "./dashboard-channel"

const channel = (id: string): ChannelInfo => ({ id, login: "l", name: "N", avatar_url: null, state: "inactive" })

describe("isChannelForbidden", () => {
  it("只認 channel_forbidden", () => {
    expect(isChannelForbidden(new DashboardApiError(403, "channel_forbidden", null, false))).toBe(true)
    expect(isChannelForbidden(new DashboardApiError(403, "no_permission", null, false))).toBe(false)
    expect(isChannelForbidden(new Error("x"))).toBe(false)
    expect(isChannelForbidden(null)).toBe(false)
  })
})

describe("channelStatusLabel", () => {
  it("只分已啟用與未啟用", () => {
    expect(channelStatusLabel("enabled")).toBe("bot 已啟用")
    expect(channelStatusLabel("inactive")).toBe("bot 未啟用")
    expect(channelStatusLabel("disabled")).toBe("bot 未啟用")
  })
})

describe("channelListView", () => {
  it("沒有頻道顯示空狀態，一個直接進去，多個才列出", () => {
    expect(channelListView([])).toEqual({ kind: "empty" })
    expect(channelListView([channel("1")])).toEqual({ kind: "redirect", channelId: "1" })
    expect(channelListView([channel("1"), channel("2")])).toEqual({ kind: "list" })
  })
})

describe("forwardAccessNotice", () => {
  it("可用時不顯示說明", () => {
    expect(forwardAccessNotice("ok")).toBeNull()
  })
  it("需要析域帳號或連結 Discord 時各有說明", () => {
    expect(forwardAccessNotice("need_domalyze")?.title).toBe("需要析域帳號")
    expect(forwardAccessNotice("need_discord")?.title).toBe("需要連結 Discord")
  })
})

describe("channelPath", () => {
  it("組出頻道頁網址", () => {
    expect(channelPath("123")).toBe("/dashboard/channels/123")
  })
})
