import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { DashboardUser } from "@/lib/dashboard-user"
import { AccountSection } from "./account"

const twitchUser: DashboardUser = {
  id: "twitch:777",
  name: "Streamer",
  avatar_url: null,
  discord: null,
  twitch: { id: "777", login: "streamer" },
  account: null,
  login_method: "twitch",
  has_channels: true,
  is_bot_owner: false,
}

describe("AccountSection", () => {
  it("沒有 Discord 身分時只顯示域民代號與管理連結，不出錯", () => {
    const html = renderToStaticMarkup(
      <AccountSection overview={{ account: { username: "willy" }, partial: false, discords: [], channels: [] }} />,
    )
    expect(html).toContain("willy")
    expect(html).toContain("管理析域帳號")
    expect(html).not.toContain("尚未連結析域帳號")
  })

  it("Twitch 登入顯示 Twitch 名稱，引導改用析域登入，不顯示需要析域帳號的連結", () => {
    const html = renderToStaticMarkup(
      <AccountSection overview={{ account: null, partial: false, discords: [], channels: [] }} user={twitchUser} />,
    )
    expect(html).toContain("Streamer")
    expect(html).toContain("能同時管理伺服器與頻道")
    expect(html).toContain('href="/dashboard-login"')
    expect(html).not.toContain("管理析域帳號")
    expect(html).not.toContain("連結後可以一起查看其他 Discord")
  })

  it("有 Discord 時不受 user 影響", () => {
    const discord = { id: "1", name: "Some One", avatar_url: "https://x/a.png", current: true, points: { stardust: 0, point: 0, rcoin: 0 }, pet: null }
    const html = renderToStaticMarkup(
      <AccountSection overview={{ account: null, partial: false, discords: [discord], channels: [] }} />,
    )
    expect(html).toContain("Some One")
    expect(html).toContain("尚未連結析域帳號")
  })
})
