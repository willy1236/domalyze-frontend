import { describe, expect, it } from "vitest"
import { discordRequiredTarget } from "./dashboard-api"
import { type DashboardUser, dashboardNav } from "./dashboard-user"

const discordUser: DashboardUser = {
  id: "111",
  name: "Some One",
  avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
  discord: { id: "111" },
  twitch: null,
  account: null,
  login_method: "discord",
}

const twitchUser: DashboardUser = {
  id: "twitch:777",
  name: "Streamer",
  avatar_url: "https://static-cdn.jtvnw.net/777.png",
  discord: null,
  twitch: { id: "777", login: "streamer" },
  account: null,
  login_method: "twitch",
}

describe("dashboardNav", () => {
  it("有 Discord 身分時顯示「我的」與「伺服器」", () => {
    expect(dashboardNav(discordUser).map((i) => i.label)).toEqual(["我的", "伺服器"])
  })
  it("只有 Twitch 身分時不顯示「伺服器」", () => {
    expect(dashboardNav(twitchUser).map((i) => i.label)).toEqual(["我的"])
  })
  it("Discord 與 Twitch 並存時照常顯示「伺服器」", () => {
    expect(dashboardNav({ ...discordUser, twitch: twitchUser.twitch }).map((i) => i.label)).toEqual(["我的", "伺服器"])
  })
  it("active 依路徑判斷", () => {
    const [mine, guilds] = dashboardNav(discordUser)
    expect(mine.active("/dashboard")).toBe(true)
    expect(mine.active("/dashboard/guilds")).toBe(false)
    expect(guilds.active("/dashboard/guilds/1")).toBe(true)
  })
})

describe("discordRequiredTarget", () => {
  it("在別的頁面導回 /dashboard", () => {
    expect(discordRequiredTarget("/dashboard/guilds/1")).toBe("/dashboard")
  })
  it("已經在 /dashboard 不再導，避免無限重新整理", () => {
    expect(discordRequiredTarget("/dashboard")).toBeNull()
  })
})
