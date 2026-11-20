import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { channelPath } from "@/lib/dashboard-channel"
import type { PersonalOverview } from "@/lib/dashboard-personal"
import { ChannelsSection } from "./channels"

const overview = (channels: PersonalOverview["channels"]): PersonalOverview => ({
  account: { username: "willy" },
  partial: false,
  discords: [],
  channels,
})

describe("ChannelsSection", () => {
  it("列出每個頻道的名稱、星羽狀態與頻道後台連結", () => {
    const html = renderToStaticMarkup(
      <ChannelsSection
        overview={overview([
          { id: "1", login: "a", name: "Alpha", avatar_url: null, role: "owner", state: "enabled" },
          { id: "2", login: "b", name: "Bravo", avatar_url: null, role: "mod", state: "inactive" },
        ])}
      />,
    )
    expect(html).toContain("Twitch 頻道")
    expect(html).toContain("我的頻道 · 星羽已啟用")
    expect(html).toContain("mod · 星羽未啟用")
    expect(html).toContain(`href="${channelPath("1")}"`)
    expect(html).toContain("Alpha")
    expect(html).toContain("星羽已啟用")
    expect(html).toContain(`href="${channelPath("2")}"`)
    expect(html).toContain("星羽未啟用")
  })

  it("沒有頻道時不顯示區塊", () => {
    expect(renderToStaticMarkup(<ChannelsSection overview={overview([])} />)).toBe("")
  })
})
