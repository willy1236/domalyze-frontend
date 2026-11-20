import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError } from "@/lib/dashboard-api"
import type { ChannelDetail } from "@/lib/dashboard-channel"
import { type DashboardUser, DashboardUserContext } from "@/lib/dashboard-user"

const load = vi.hoisted(() => ({
  value: { data: null as ChannelDetail | null, error: null as unknown, reload: async () => {} },
}))
vi.mock("@/lib/use-load", () => ({ useLoad: () => load.value }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {} }), usePathname: () => "/dashboard/twitch/777" }))

import { ChannelAccessGuard, channelGuardView, useChannel } from "./channel-access-guard"

const detail: ChannelDetail = {
  id: "777",
  login: "streamer",
  name: "Streamer",
  avatar_url: null,
  role: "owner",
  state: "inactive",
  forward_access: "need_domalyze",
  health: { state: "inactive", issues: [], paused_features: [] },
}
const forbidden = new DashboardApiError(403, "channel_forbidden", null, false)

function Probe() {
  return <p>{useChannel().name}</p>
}

const user = (login_method: DashboardUser["login_method"]): DashboardUser => ({
  id: "u",
  name: "u",
  avatar_url: null,
  discord: null,
  twitch: null,
  account: null,
  login_method,
  has_channels: true,
  is_bot_owner: false,
})

const render = (loginMethod?: DashboardUser["login_method"]) =>
  renderToStaticMarkup(
    <DashboardUserContext.Provider value={loginMethod ? user(loginMethod) : null}>
      <ChannelAccessGuard channelId="777">
        <Probe />
      </ChannelAccessGuard>
    </DashboardUserContext.Provider>,
  )

describe("channelGuardView", () => {
  it("沒有權限優先於其他錯誤", () => {
    expect(channelGuardView(null, forbidden)).toBe("forbidden")
    expect(channelGuardView(null, new Error("x"))).toBe("failed")
    expect(channelGuardView(null, null)).toBe("loading")
    expect(channelGuardView(detail, null)).toBe("ready")
  })
})

describe("ChannelAccessGuard", () => {
  beforeEach(() => {
    load.value = { data: null, error: null, reload: async () => {} }
  })

  it("收到 channel_forbidden 顯示「沒有這個頻道的權限」，不渲染內容", () => {
    load.value = { ...load.value, error: forbidden }
    const html = render()
    expect(html).toContain("沒有這個頻道的權限")
    expect(html).not.toContain("Streamer")
  })

  it("Twitch 登入收到 channel_forbidden 仍顯示沒有權限，不離開", () => {
    load.value = { ...load.value, error: forbidden }
    expect(render("twitch")).toContain("沒有這個頻道的權限")
  })

  it("析域登入收到 channel_forbidden 不顯示沒有權限，等導回頻道清單", () => {
    load.value = { ...load.value, error: forbidden }
    const html = render("domalyze")
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain("沒有這個頻道的權限")
  })

  it("沒有已載入的資料時，沒有權限的頁面說明可能已不是 mod 並附回到頻道清單", () => {
    load.value = { ...load.value, error: forbidden }
    const html = render("twitch")
    expect(html).toContain("可能已不是 mod，或實況主關閉了 mod 協作")
    expect(html).toContain('href="/dashboard/twitch"')
  })

  it("已載入的頻道原本是 mod 頻道，之後收到 channel_forbidden：不論登入方式都等導回頻道清單", () => {
    load.value = { ...load.value, data: { ...detail, role: "mod" }, error: forbidden }
    for (const method of ["twitch", "domalyze"] as const) {
      const html = render(method)
      expect(html).toContain('aria-busy="true"')
      expect(html).not.toContain("沒有這個頻道的權限")
    }
  })

  it("其他錯誤顯示載入失敗與重新載入", () => {
    load.value = { ...load.value, error: new Error("x") }
    const html = render()
    expect(html).toContain("無法載入頻道資料")
    expect(html).toContain("重新載入")
  })

  it("載入中不渲染內容", () => {
    const html = render()
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain("Streamer")
  })

  it("載入完成後內容拿得到頻道資料", () => {
    load.value = { ...load.value, data: detail }
    expect(render()).toContain("Streamer")
  })
})
