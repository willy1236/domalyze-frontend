import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { AccountSection } from "./account"

describe("AccountSection", () => {
  it("沒有 Discord 身分時只顯示域民代號與管理連結，不出錯", () => {
    const html = renderToStaticMarkup(
      <AccountSection overview={{ account: { username: "willy" }, partial: false, discords: [], channels: [] }} />,
    )
    expect(html).toContain("willy")
    expect(html).toContain("管理析域帳號")
    expect(html).not.toContain("尚未連結析域帳號")
  })
})
