import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { EventResponse } from "@/lib/dashboard-channel-events"
import { EventRowView } from "./event-response-list"

const response = (over: Partial<EventResponse> = {}): EventResponse => ({
  kind: "resubscribe",
  enabled: true,
  template: "感謝 {user} 的訂閱！累積訂閱 {months} 個月！",
  is_default: true,
  variables: [
    { token: "{user}", description: "觸發事件的人" },
    { token: "{months}", description: "累積訂閱月數" },
  ],
  ...over,
})

const noop = () => {}

function render(over: Partial<React.ComponentProps<typeof EventRowView>> = {}) {
  const r = response()
  return renderToStaticMarkup(
    <EventRowView
      response={r}
      draft={{ enabled: r.enabled, template: r.template }}
      isDefault={r.is_default}
      dirty={false}
      readOnly={false}
      onChange={noop}
      onSave={noop}
      onReset={noop}
      {...over}
    />,
  )
}

describe("EventRowView", () => {
  it("顯示事件名稱、預設標記、文字、變數與字數", () => {
    const html = render()
    for (const text of ["續訂", "（預設文字）", "累積訂閱 {months} 個月", "{months}", "累積訂閱月數", "／500"]) {
      expect(html).toContain(text)
    }
  })
  it("沒有設定過的事件是關閉的預設文字", () => {
    const r = response({ enabled: false })
    const html = render({ response: r, draft: { enabled: false, template: r.template } })
    expect(html).not.toContain("checked")
    expect(html).toContain("（預設文字）")
  })
  it("開啟的事件勾選啟用", () => {
    expect(render()).toContain("checked")
  })
  it("續訂那列提示觀眾發出續訂訊息時才會回應", () => {
    expect(render()).toContain("觀眾發出續訂訊息時才會回應")
  })
  it("追隨那列提示 10 秒內只感謝第一位追隨者", () => {
    const r = response({ kind: "follow" })
    expect(render({ response: r })).toContain("10 秒內只感謝第一位追隨者")
  })
  it("自訂過的設定沒有預設標記，恢復預設可按", () => {
    const html = render({ isDefault: false })
    expect(html).not.toContain("（預設文字）")
    expect(html.match(/disabled=""/g) ?? []).toHaveLength(1) // 只有「儲存」停用（沒有改動）
  })
  it("沒有改動時不能儲存，已是預設時不能恢復預設", () => {
    expect(render().match(/disabled=""/g)).toHaveLength(2)
  })
  it("有改動時可以儲存", () => {
    expect((render({ dirty: true, isDefault: false }).match(/disabled=""/g) ?? []).length).toBe(0)
  })
  it("星羽沒啟用時開關與文字都停用，也沒有按鈕", () => {
    const html = render({ readOnly: true })
    expect(html.match(/disabled=""/g)).toHaveLength(2)
    expect(html).not.toContain("儲存")
    expect(html).not.toContain("恢復預設")
  })
  it("顯示欄位錯誤與提示", () => {
    const html = render({ error: "這段文字會被擋下", notice: "儲存失敗" })
    expect(html).toContain("這段文字會被擋下")
    expect(html).toContain("儲存失敗")
  })
})
