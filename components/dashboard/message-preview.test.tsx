import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { emptyEmbed } from "@/lib/dashboard-message"
import { MessagePreview, renderInline } from "./message-preview"

const html = (nodes: ReturnType<typeof renderInline>) => renderToStaticMarkup(<>{nodes}</>)

describe("renderInline", () => {
  it("只處理粗體、斜體與連結", () => {
    expect(html(renderInline("a **b** *c* _d_"))).toBe("a <strong>b</strong> <em>c</em> <em>d</em>")
    expect(html(renderInline("[x](https://a.b/c)"))).toContain('href="https://a.b/c"')
    expect(html(renderInline("[x](javascript:alert(1))"))).not.toContain("<a")
    expect(html(renderInline("# 標題 `code`"))).toBe("# 標題 `code`")
  })
})

describe("MessagePreview", () => {
  it("按鈕每 5 顆換列", () => {
    const buttons = Array.from({ length: 7 }, (_, i) => ({ label: `b${i}` }))
    const out = renderToStaticMarkup(<MessagePreview value={{ content: "hi", embed: null }} buttons={buttons} />)
    expect(out.match(/data-max-per-row/g)).toHaveLength(2)
  })

  it("只有顏色的 embed 不顯示，時間戳 now 顯示說明", () => {
    const onlyColor = renderToStaticMarkup(<MessagePreview value={{ content: "hi", embed: { ...emptyEmbed(), color: 5 } }} />)
    expect(onlyColor).not.toContain("border-l-4")
    const stamped = renderToStaticMarkup(
      <MessagePreview value={{ content: null, embed: { ...emptyEmbed(), title: "t", extra: { timestamp: "now" } } }} />,
    )
    expect(stamped).toContain("送出時的時間")
  })
})
