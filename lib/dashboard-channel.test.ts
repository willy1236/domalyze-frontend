import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  type ChannelInfo,
  channelAction,
  channelLeaveTarget,
  leaveIfUnlinked,
  channelListView,
  channelPath,
  CHANNEL_UNLINKED_URL,
  channelStatusLabel,
  disableNotices,
  enableUrl,
  forwardAccessNotice,
  isChannelForbidden,
  parseChannelNotices,
  parseChannelListNotice,
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
    expect(channelStatusLabel("enabled")).toBe("星羽已啟用")
    expect(channelStatusLabel("inactive")).toBe("星羽未啟用")
    expect(channelStatusLabel("disabled")).toBe("星羽已停用")
    expect(channelStatusLabel("banned")).toBe("星羽已停權")
  })
})

describe("channelAction", () => {
  it("未啟用與已停用是（重新）啟用，已啟用是停用", () => {
    expect(channelAction("inactive")).toEqual({ kind: "enable", label: "啟用星羽" })
    expect(channelAction("disabled")).toEqual({ kind: "enable", label: "重新啟用" })
    expect(channelAction("banned")).toEqual({ kind: "none" })
    expect(channelAction("enabled")).toEqual({ kind: "disable", label: "停用星羽" })
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
    expect(parseChannelNotices("channel_banned")).toEqual(["channel_banned"])
  })
})

describe("channelListView", () => {
  it("沒有頻道顯示空狀態，有頻道（含只有一個）一律列出，不自動導入", () => {
    expect(channelListView([])).toEqual({ kind: "empty" })
    expect(channelListView([channel("1")])).toEqual({ kind: "list" })
    expect(channelListView([channel("1"), channel("2")])).toEqual({ kind: "list" })
  })
})

describe("channelLeaveTarget", () => {
  const forbidden = new DashboardApiError(403, "channel_forbidden", null, false)
  it("析域登入的頻道被解除連結時回到頻道清單並帶提示", () => {
    expect(channelLeaveTarget(forbidden, "domalyze")).toBe("/dashboard/twitch?notice=channel_unlinked")
  })
  it("其他登入方式或其他錯誤留在原頁", () => {
    expect(channelLeaveTarget(forbidden, "twitch")).toBeNull()
    expect(channelLeaveTarget(forbidden, "discord")).toBeNull()
    expect(channelLeaveTarget(forbidden, undefined)).toBeNull()
    expect(channelLeaveTarget(new Error("x"), "domalyze")).toBeNull()
    expect(channelLeaveTarget(null, "domalyze")).toBeNull()
  })
})

describe("leaveIfUnlinked", () => {
  const forbidden = new DashboardApiError(403, "channel_forbidden", null, false)
  it("析域登入收到 channel_forbidden：導到頻道清單並回 true", () => {
    const visited: string[] = []
    expect(leaveIfUnlinked(forbidden, "domalyze", (url) => visited.push(url))).toBe(true)
    expect(visited).toEqual([CHANNEL_UNLINKED_URL])
  })
  it("其他情況不導頁、回 false，呼叫端照常處理錯誤", () => {
    const visited: string[] = []
    const replace = (url: string) => visited.push(url)
    expect(leaveIfUnlinked(forbidden, "twitch", replace)).toBe(false)
    expect(leaveIfUnlinked(new DashboardApiError(409, "conflict", null, false), "domalyze", replace)).toBe(false)
    expect(leaveIfUnlinked(new Error("x"), "domalyze", replace)).toBe(false)
    expect(visited).toEqual([])
  })
})

describe("parseChannelListNotice", () => {
  it("只認得已知的提示", () => {
    expect(parseChannelListNotice("channel_unlinked")).toBe("channel_unlinked")
    expect(parseChannelListNotice("toString")).toBeNull()
    expect(parseChannelListNotice(null)).toBeNull()
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
    expect(channelPath("123")).toBe("/dashboard/twitch/123")
  })
})

describe("disableNotices", () => {
  it("星羽離線或沒完成同步時提醒會晚一點才離開", () => {
    expect(disableNotices({ state: "disabled", bot_offline: true })).toEqual(["disable_bot_offline"])
  })
  it("星羽已處理就沒有提示", () => {
    expect(disableNotices({ state: "disabled", bot_offline: false })).toEqual([])
  })
})

describe("CHANNEL_NOTICES", () => {
  it("停用用的代碼也能從網址解析", () => {
    expect(parseChannelNotices("disable_bot_offline")).toEqual(["disable_bot_offline"])
  })
})
