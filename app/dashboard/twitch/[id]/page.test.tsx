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
})

function render(state: ChannelDetail["state"]): string {
  channel.value = detail(state)
  return renderToStaticMarkup(<ChannelOverviewPage />)
}

describe("頻道總覽的狀態說明", () => {
  it("已啟用", () => {
    expect(render("enabled")).toContain("星羽已在這個頻道運作。")
  })
  it("未啟用說明不出現 bot 字樣", () => {
    const html = render("inactive")
    expect(html).toContain("星羽還沒有在這個頻道啟用。啟用後，星羽會加入你的聊天室並回應指令。")
    expect(html).not.toContain("bot")
  })
})
