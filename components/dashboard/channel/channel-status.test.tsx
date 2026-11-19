import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ChannelStatus } from "./channel-status"

describe("ChannelStatus", () => {
  it("未啟用顯示「bot 未啟用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="inactive" />)).toContain("bot 未啟用")
  })
  it("已停用顯示「bot 已停用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="disabled" />)).toContain("bot 已停用")
  })
  it("已啟用顯示「bot 已啟用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="enabled" />)).toContain("bot 已啟用")
  })
})
