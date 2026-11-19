import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("./channel-access-guard", () => ({ useReloadChannel: () => async () => {} }))

import { ChannelActivation } from "./channel-activation"
import { ChannelStatus } from "./channel-status"

describe("ChannelActivation", () => {
  it("未啟用顯示「啟用星羽」，沒有停用按鈕", () => {
    const html = renderToStaticMarkup(<ChannelActivation channelId="777" state="inactive" />)
    expect(html).toContain("啟用星羽")
    expect(html).not.toContain("停用星羽")
  })
  it("已停用顯示「重新啟用」", () => {
    const html = renderToStaticMarkup(<ChannelActivation channelId="777" state="disabled" />)
    expect(html).toContain("重新啟用")
  })
  it("已啟用只顯示「停用星羽」，確認前不顯示確認鈕", () => {
    const html = renderToStaticMarkup(<ChannelActivation channelId="777" state="enabled" />)
    expect(html).toContain("停用星羽")
    expect(html).not.toContain("確認停用")
    expect(html).not.toContain("啟用星羽")
  })
})

describe("ChannelStatus 帶 channelId", () => {
  it("標籤下方多出操作", () => {
    const html = renderToStaticMarkup(<ChannelStatus state="inactive" channelId="777" />)
    expect(html).toContain("星羽未啟用")
    expect(html).toContain("啟用星羽")
  })
})
