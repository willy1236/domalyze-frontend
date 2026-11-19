import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { linkTwitchNote } from "@/lib/dashboard-channel"
import { DOMALYZE_LINK_TWITCH_URL } from "@/lib/dashboard-login"
import { type DashboardUser, DashboardUserContext } from "@/lib/dashboard-user"
import { LinkTwitchAccount } from "./link-twitch-account"

const user = (login_method: DashboardUser["login_method"]): DashboardUser => ({
  id: "1",
  name: "N",
  avatar_url: null,
  discord: null,
  twitch: null,
  account: null,
  login_method,
  has_channels: false,
})

const render = (method: DashboardUser["login_method"], label?: string) =>
  renderToStaticMarkup(
    <DashboardUserContext.Provider value={user(method)}>
      <LinkTwitchAccount label={label} />
    </DashboardUserContext.Provider>,
  )

describe("LinkTwitchAccount", () => {
  it("連到 auth server 的連結 Twitch 入口，另開分頁", () => {
    const html = render("domalyze")
    expect(html).toContain(`href="${DOMALYZE_LINK_TWITCH_URL}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain("連結更多 Twitch 帳號")
  })
  it("空狀態用「連結 Twitch 帳號」", () => {
    expect(render("domalyze", "連結 Twitch 帳號")).toContain("連結 Twitch 帳號")
  })
  it("說明依登入方式而異", () => {
    expect(render("domalyze")).toContain("連結後 60 秒內會出現在這裡。")
    expect(render("twitch")).toContain("連結到析域帳號後，用析域帳號登入就能在這裡管理所有頻道。")
    expect(render("discord")).toContain("連結到析域帳號後，用析域帳號登入就能在這裡管理所有頻道。")
  })
})

describe("linkTwitchNote", () => {
  it("還沒取得使用者時用一般說明", () => {
    expect(linkTwitchNote(undefined)).toContain("用析域帳號登入")
  })
})

describe("DOMALYZE_LINK_TWITCH_URL", () => {
  it("由析域帳號網址組出", () => {
    expect(DOMALYZE_LINK_TWITCH_URL).toBe("https://auth.domalyze.net/account/link/twitch")
  })
})
