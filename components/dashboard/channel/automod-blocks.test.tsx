import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { AutomodBlock } from "@/lib/dashboard-channel-automod"
import { AutomodBlockList } from "./automod-blocks"

const block = (over: Partial<AutomodBlock> = {}): AutomodBlock => ({
  id: 1,
  at: "2026-11-19T04:00:00Z",
  source_kind: "command",
  source_key: "hi",
  text: "壞訊息",
  reason: "automod",
  ...over,
})

describe("AutomodBlockList", () => {
  it("沒有紀錄顯示空狀態", () => {
    expect(renderToStaticMarkup(<AutomodBlockList blocks={[]} />)).toContain("最近沒有被擋下的訊息")
  })
  it("列出來源、原因與文字", () => {
    const html = renderToStaticMarkup(
      <AutomodBlockList
        blocks={[block(), block({ id: 2, source_kind: "timer", source_key: "3", reason: "check_failed", text: "另一則" })]}
      />,
    )
    expect(html).toContain("指令 !hi")
    expect(html).toContain("被 AutoMod 擋下")
    expect(html).toContain("壞訊息")
    expect(html).toContain("計時訊息")
    expect(html).toContain("檢查失敗")
    expect(html).toContain("另一則")
  })
})
