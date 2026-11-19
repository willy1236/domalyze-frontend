import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import DashboardLoginPage from "./page"

describe("登入頁", () => {
  const html = renderToStaticMarkup(<DashboardLoginPage />)
  const at = (text: string) => html.indexOf(text)

  it("析域帳號在最上面，其次是說明、分隔，最後才是 Discord 與 Twitch", () => {
    const order = ["以析域帳號登入", "一次管理 Discord 伺服器與 Twitch 頻道", "或", "以 Discord 登入", "以 Twitch 登入"].map(at)
    expect(order.every((i) => i >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })
  it("說明講清楚完整功能與其他方式的限制，不出現 bot 字樣", () => {
    expect(html).toContain("析域帳號能使用後台的完整功能")
    expect(html).toContain("用 Discord 或 Twitch 登入，只能管理該平台的部分。")
    expect(html).not.toMatch(/bot/i)
  })
  it("析域帳號用主要按鈕樣式，其他兩個是 outline", () => {
    const anchor = (label: string) => html.slice(html.lastIndexOf("<a", at(label)), at(label))
    expect(anchor("以析域帳號登入")).toContain("shadow-[0_0_25px")
    expect(anchor("以 Discord 登入")).not.toContain("shadow-[0_0_25px")
    expect(anchor("以 Twitch 登入")).not.toContain("shadow-[0_0_25px")
  })
})
