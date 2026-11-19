import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ChannelStatus } from "./channel-status"

describe("ChannelStatus", () => {
  it("未啟用顯示「星羽未啟用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="inactive" />)).toContain("星羽未啟用")
  })
  it("已停用顯示「星羽已停用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="disabled" />)).toContain("星羽已停用")
  })
  it("已啟用顯示「星羽已啟用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="enabled" />)).toContain("星羽已啟用")
  })
})
