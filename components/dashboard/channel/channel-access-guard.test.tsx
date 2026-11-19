import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError } from "@/lib/dashboard-api"
import type { ChannelDetail } from "@/lib/dashboard-channel"

const load = vi.hoisted(() => ({
  value: { data: null as ChannelDetail | null, error: null as unknown, reload: async () => {} },
}))
vi.mock("@/lib/use-load", () => ({ useLoad: () => load.value }))

import { ChannelAccessGuard, channelGuardView, useChannel } from "./channel-access-guard"

const detail: ChannelDetail = {
  id: "777",
  login: "streamer",
  name: "Streamer",
  avatar_url: null,
  state: "inactive",
  forward_access: "need_domalyze",
}
const forbidden = new DashboardApiError(403, "channel_forbidden", null, false)

function Probe() {
  return <p>{useChannel().name}</p>
}

const render = () =>
  renderToStaticMarkup(
    <ChannelAccessGuard channelId="777">
      <Probe />
    </ChannelAccessGuard>,
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
