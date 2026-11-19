import { afterEach, describe, expect, it, vi } from "vitest"
import { type PersonalOverview, accountLabel, guildListRedirect, hasDiscord, isLocked, reportLinkClick } from "./dashboard-personal"

const base: PersonalOverview = { account: null, partial: false, discords: [], channels: [] }

describe("個人區", () => {
  it("沒有析域帳號時鎖住工具與公開設定", () => {
    expect(isLocked(base)).toBe(true)
    expect(isLocked({ ...base, account: { username: "willy" } })).toBe(false)
    expect(isLocked({ ...base, account: { username: null } })).toBe(false)
  })
  it("沒有 Discord 身分（只連結 Twitch 的析域帳號）時不是 Discord 個人區", () => {
    expect(hasDiscord(base)).toBe(false)
    const discord = { id: "1", name: "n", avatar_url: "u", current: true, points: { stardust: 0, point: 0, rcoin: 0 }, pet: null }
    expect(hasDiscord({ ...base, discords: [discord] })).toBe(true)
  })
  it("代號暫時查不到時顯示說明", () => {
    expect(accountLabel({ username: "willy" })).toBe("willy")
    expect(accountLabel({ username: null })).toBe("代號暫時無法載入")
  })
})

describe("guildListRedirect", () => {
  it("帶 notice 時轉到伺服器清單並保留參數", () => {
    expect(guildListRedirect("?notice=need_permissions")).toBe("/dashboard/guilds?notice=need_permissions")
    expect(guildListRedirect("?notice=invite_pending&x=1")).toBe("/dashboard/guilds?notice=invite_pending&x=1")
  })
  it("沒有 notice 時留在個人區", () => {
    expect(guildListRedirect("")).toBeNull()
    expect(guildListRedirect("?x=1")).toBeNull()
  })
})

describe("reportLinkClick", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("送出 POST /dashboard/personal/link-click 且不等回應", () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}))
    vi.stubGlobal("fetch", fetchMock)
    expect(reportLinkClick()).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/dashboard\/personal\/link-click$/)
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("include")
  })

  it("請求失敗時不拋錯", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("network"))))
    const unhandled = vi.fn()
    process.on("unhandledRejection", unhandled)
    reportLinkClick()
    await new Promise((r) => setTimeout(r, 0))
    process.off("unhandledRejection", unhandled)
    expect(unhandled).not.toHaveBeenCalled()
  })
})
