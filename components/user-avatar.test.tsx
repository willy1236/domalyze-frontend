import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { UserAvatar } from "./user-avatar"

describe("UserAvatar", () => {
  it("有頭像時顯示圖片", () => {
    const html = renderToStaticMarkup(<UserAvatar src="https://cdn.example/a.png" name="willy" />)
    expect(html).toContain('<img src="https://cdn.example/a.png"')
  })
  it("沒有頭像時顯示名稱的第一個字", () => {
    const html = renderToStaticMarkup(<UserAvatar src={null} name="星羽" />)
    expect(html).not.toContain("<img")
    expect(html).toContain(">星<")
  })
})
