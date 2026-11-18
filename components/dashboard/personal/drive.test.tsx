import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { DriveState } from "@/lib/dashboard-drive"
import { DriveView } from "./drive"

const state = (over: Partial<DriveState> = {}): DriveState => ({ writable: true, unavailable: false, eligible: true, gmail: "abc@gmail.com", ...over })
const render = (s: DriveState, error: string | null = null) =>
  renderToStaticMarkup(<DriveView state={s} busy={false} error={error} onSave={() => {}} onRemove={() => {}} />)

describe("DriveView", () => {
  it("顯示目前共用的 gmail，可更換與取消", () => {
    const out = render(state())
    expect(out).toContain("abc@gmail.com")
    expect(out).toContain("更換")
    expect(out).toContain("取消共用")
  })

  it("尚未共用時只有設定，沒有取消", () => {
    const out = render(state({ gmail: null }))
    expect(out).toContain("尚未共用")
    expect(out).toContain("設定")
    expect(out).not.toContain("取消共用")
  })

  it("沒有析域帳號時唯讀：看得到 gmail，沒有表單與按鈕", () => {
    const out = render(state({ writable: false }))
    expect(out).toContain("abc@gmail.com")
    expect(out).not.toContain("<form")
    expect(out).not.toContain("取消共用")
  })

  it("暫時無法載入時不顯示共用狀態", () => {
    const out = render(state({ unavailable: true, gmail: null, writable: false }))
    expect(out).toContain("暫時無法載入")
    expect(out).not.toContain("尚未共用")
  })

  it("失敗原因顯示在表單內", () => {
    expect(render(state(), "Google 雲端共用失敗")).toContain("Google 雲端共用失敗")
  })

  it("沒有輸入時送出鈕停用", () => {
    expect(render(state())).toMatch(/<button type="submit"[^>]*disabled/)
  })
})
