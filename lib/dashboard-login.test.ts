import { beforeEach, describe, expect, it } from "vitest"
import {
  LOGIN_NEXT_KEY,
  LOGIN_NOTICES,
  forgetNext,
  isLoginNotice,
  loginPageUrl,
  providerLoginUrl,
  rememberNext,
  resolveNext,
  sanitizeNext,
  selectErrorAction,
} from "./dashboard-login"

beforeEach(() => {
  sessionStorage.clear()
})

describe("sanitizeNext", () => {
  it.each(["/dashboard", "/dashboard/guilds/1", "/dashboard?x=1"])("接受 %s", (v) => {
    expect(sanitizeNext(v)).toBe(v)
  })
  it.each([null, "", "/", "https://evil.example", "//evil.example", "/dashboardx", "/dashboard\\x", "/dashboard/\n"])(
    "其他一律回 /dashboard：%s",
    (v) => {
      expect(sanitizeNext(v)).toBe("/dashboard")
    },
  )
})

describe("網址", () => {
  it("登入頁帶 next 與 notice", () => {
    expect(loginPageUrl("/dashboard/guilds/1")).toBe("/dashboard-login?next=%2Fdashboard%2Fguilds%2F1")
    expect(loginPageUrl("/x", "domalyze_expired")).toBe("/dashboard-login?notice=domalyze_expired&next=%2Fdashboard")
  })
  it("各登入入口都帶 next 與 origin", () => {
    expect(providerLoginUrl("discord", "/dashboard/guilds/1", "https://a.test")).toBe(
      "/to/dashboard-login?next=%2Fdashboard%2Fguilds%2F1&origin=https%3A%2F%2Fa.test",
    )
    expect(providerLoginUrl("domalyze", "/dashboard", "https://a.test")).toBe(
      "/to/dashboard-domalyze-login?next=%2Fdashboard&origin=https%3A%2F%2Fa.test",
    )
    expect(providerLoginUrl("twitch", "/dashboard/twitch/1", "https://a.test")).toBe(
      "/to/dashboard-twitch-login?next=%2Fdashboard%2Ftwitch%2F1&origin=https%3A%2F%2Fa.test",
    )
  })
})

describe("resolveNext", () => {
  it("網址的 next 優先", () => {
    rememberNext("/dashboard/guilds/2")
    const q = new URLSearchParams({ notice: "domalyze_expired", next: "/dashboard/guilds/1" })
    expect(resolveNext(q)).toBe("/dashboard/guilds/1")
  })
  it("析域登入逾時且網址沒有 next 時，用登入前記下的值", () => {
    rememberNext("/dashboard/guilds/2")
    expect(resolveNext(new URLSearchParams({ notice: "domalyze_expired" }))).toBe("/dashboard/guilds/2")
  })
  it("其他提示不取記下的值", () => {
    rememberNext("/dashboard/guilds/2")
    expect(resolveNext(new URLSearchParams({ notice: "domalyze_denied" }))).toBe("/dashboard")
  })
  it("記下的值也要驗證", () => {
    sessionStorage.setItem(LOGIN_NEXT_KEY, "https://evil.example")
    expect(resolveNext(new URLSearchParams({ notice: "domalyze_expired" }))).toBe("/dashboard")
  })
  it("清掉後回 /dashboard", () => {
    rememberNext("/dashboard/guilds/2")
    forgetNext()
    expect(resolveNext(new URLSearchParams({ notice: "domalyze_expired" }))).toBe("/dashboard")
  })
})

describe("LOGIN_NOTICES", () => {
  it("沒有連結 Discord 也沒有連結 Twitch 時，提示先連結其中一個", () => {
    expect(LOGIN_NOTICES.domalyze_no_discord).toContain("連結 Discord 或 Twitch")
  })
})

describe("isLoginNotice", () => {
  it("只認得已知的提示", () => {
    expect(isLoginNotice("domalyze_no_discord")).toBe(true)
    expect(isLoginNotice("toString")).toBe(false)
    expect(isLoginNotice(null)).toBe(false)
  })
})

describe("selectErrorAction", () => {
  it("依錯誤碼分流", () => {
    expect(selectErrorAction("pick_expired")).toBe("restart")
    expect(selectErrorAction("invalid_candidate")).toBe("reload")
    expect(selectErrorAction("invalid_request")).toBe("error")
    expect(selectErrorAction(null)).toBe("error")
  })
})
