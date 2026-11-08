import { describe, expect, it } from "vitest"
import { renderMentions } from "./dashboard-preview"

describe("renderMentions", () => {
  it("身分組提及顯示成 @名稱", () => {
    expect(renderMentions("地震 <@&21>", "21", "公告")).toBe("地震 @公告")
  })

  it("不認得的身分組顯示成 @身分組", () => {
    expect(renderMentions("<@&99>", "21", "公告")).toBe("@身分組")
    expect(renderMentions("<@&21>", "21", null)).toBe("@身分組")
  })

  it("成員提及顯示成 @範例成員", () => {
    expect(renderMentions("<@100000000000000000> 加入了我們", null, null)).toBe("@範例成員 加入了我們")
  })

  it("沒有提及時原樣回傳", () => {
    expect(renderMentions("hello\nhttps://x.com/a/status/1", null, null)).toBe("hello\nhttps://x.com/a/status/1")
  })
})
