import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  type ChannelInfo,
  channelAction,
  channelListView,
  channelPath,
  channelStatusLabel,
  disableNotices,
  enableUrl,
  forwardAccessNotice,
  isChannelForbidden,
  parseChannelNotices,
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
  it("未啟用、已啟用、已停用各有標籤", () => {
    expect(channelStatusLabel("enabled")).toBe("bot 已啟用")
    expect(channelStatusLabel("inactive")).toBe("bot 未啟用")
    expect(channelStatusLabel("disabled")).toBe("bot 已停用")
  })
})

describe("channelAction", () => {
  it("未啟用與已停用是（重新）啟用，已啟用是停用", () => {
    expect(channelAction("inactive")).toEqual({ kind: "enable", label: "啟用 bot" })
    expect(channelAction("disabled")).toEqual({ kind: "enable", label: "重新啟用" })
    expect(channelAction("enabled")).toEqual({ kind: "disable", label: "停用 bot" })
  })
})

describe("enableUrl", () => {
  it("帶頻道與前端 origin", () => {
    const url = new URL(enableUrl("123", "https://localhost:3001"), "https://api.example")
    expect(url.pathname).toBe("/to/dashboard-twitch-enable")
    expect(url.searchParams.get("channel")).toBe("123")
    expect(url.searchParams.get("origin")).toBe("https://localhost:3001")
  })
})

describe("parseChannelNotices", () => {
  it("沒有參數是空的", () => {
    expect(parseChannelNotices(null)).toEqual([])
    expect(parseChannelNotices("")).toEqual([])
  })
  it("多個代碼依序解析，不認得的忽略", () => {
    expect(parseChannelNotices("mod_failed,bot_offline")).toEqual(["mod_failed", "bot_offline"])
    expect(parseChannelNotices("wrong_account,nope,toString")).toEqual(["wrong_account"])
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

describe("disableNotices", () => {
  it("bot 離線或沒完成同步時提醒會晚一點才離開", () => {
    expect(disableNotices({ state: "disabled", bot_offline: true })).toEqual(["disable_bot_offline"])
  })
  it("bot 已處理就沒有提示", () => {
    expect(disableNotices({ state: "disabled", bot_offline: false })).toEqual([])
  })
})

describe("CHANNEL_NOTICES", () => {
  it("停用用的代碼也能從網址解析", () => {
    expect(parseChannelNotices("disable_bot_offline")).toEqual(["disable_bot_offline"])
  })
})
