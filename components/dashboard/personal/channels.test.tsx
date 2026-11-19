import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { PersonalOverview } from "@/lib/dashboard-personal"
import { ChannelsSection } from "./channels"

const overview = (channels: PersonalOverview["channels"]): PersonalOverview => ({
  account: { username: "willy" },
  partial: false,
  discords: [],
  channels,
})

describe("ChannelsSection", () => {
  it("列出每個頻道的名稱、bot 狀態與頻道後台連結", () => {
    const html = renderToStaticMarkup(
      <ChannelsSection
        overview={overview([
          { id: "1", login: "a", name: "Alpha", avatar_url: null, state: "enabled" },
          { id: "2", login: "b", name: "Bravo", avatar_url: null, state: "inactive" },
        ])}
      />,
    )
    expect(html).toContain("我的頻道")
    expect(html).toContain('href="/dashboard/channels/1"')
    expect(html).toContain("Alpha")
    expect(html).toContain("bot 已啟用")
    expect(html).toContain('href="/dashboard/channels/2"')
    expect(html).toContain("bot 未啟用")
  })

  it("沒有頻道時不顯示區塊", () => {
    expect(renderToStaticMarkup(<ChannelsSection overview={overview([])} />)).toBe("")
  })
})
