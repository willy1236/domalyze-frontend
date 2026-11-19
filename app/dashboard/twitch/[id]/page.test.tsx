import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { ChannelDetail } from "@/lib/dashboard-channel"

const channel = vi.hoisted(() => ({ value: null as unknown }))
vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({ useChannel: () => channel.value }))
vi.mock("@/components/dashboard/channel/automod-blocks", () => ({ AutomodBlocks: () => null }))

import ChannelOverviewPage from "./page"

const detail = (state: ChannelDetail["state"]): ChannelDetail => ({
  id: "777",
  login: "streamer",
  name: "Streamer",
  avatar_url: null,
  state,
  forward_access: "ok",
  health: { state: "inactive", issues: [], paused_features: [] },
})

/** 狀態說明那一段的文字（總覽頁裡唯一的 <p>） */
function statusText(state: ChannelDetail["state"]): string {
  channel.value = detail(state)
  const html = renderToStaticMarkup(<ChannelOverviewPage />)
  const match = /<p[^>]*>([^<]*)<\/p>/.exec(html)
  if (!match) throw new Error("找不到狀態說明")
  return match[1]
}

describe("頻道總覽的狀態說明", () => {
  it("已啟用", () => {
    expect(statusText("enabled")).toBe("星羽已在這個頻道運作。")
  })
  it("未啟用", () => {
    expect(statusText("inactive")).toBe("星羽還沒有在這個頻道啟用。啟用後，星羽會加入你的聊天室並回應指令。")
  })
})
