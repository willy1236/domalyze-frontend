import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SectionInfo } from "@/lib/dashboard-sections"

const ctx = vi.hoisted(() => ({
  value: { sections: null as SectionInfo[] | null, failed: false, can: () => false, reload: () => {} },
}))
vi.mock("@/components/dashboard/guild-sections", () => ({ useGuildSections: () => ctx.value }))
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "123" }), useRouter: () => ({ replace: vi.fn() }) }))

import { SectionGuard, denyPlan, guardState } from "./section-guard"

const notify: SectionInfo[] = [{ key: "notify", actions: ["view"] }]
const voice: SectionInfo[] = [{ key: "dynamic_voice", actions: ["view"] }]
const banOnly: SectionInfo[] = [{ key: "warnings", actions: ["view", "ban"] }]

const render = (section: "notify" | "dynamic_voice" = "notify") =>
  renderToStaticMarkup(
    <SectionGuard section={section}>
      <p>內容</p>
    </SectionGuard>,
  )

describe("guardState", () => {
  it("failed 優先於 loading", () => {
    expect(guardState(null, true, "notify")).toBe("failed")
    expect(guardState(null, false, "notify")).toBe("loading")
  })
  it("依區塊權限判斷", () => {
    expect(guardState(notify, false, "notify")).toBe("allowed")
    expect(guardState(notify, false, "dynamic_voice")).toBe("denied")
  })
})

describe("denyPlan", () => {
  it("silent 不提示，否則提示", () => {
    expect(denyPlan(voice, true).alert).toBe(false)
    expect(denyPlan(voice, false).alert).toBe(true)
  })
  it("導向第一個有權限且已完成的區塊；沒有就是 null", () => {
    expect(denyPlan(voice, true).target?.key).toBe("dynamic_voice")
    expect(denyPlan(banOnly, false).target).toBeNull()
  })
})

describe("SectionGuard", () => {
  beforeEach(() => {
    ctx.value = { sections: null, failed: false, can: () => false, reload: () => {} }
  })

  it("載入中不渲染 children", () => {
    const out = render()
    expect(out).toContain("載入中")
    expect(out).not.toContain("內容")
  })
  it("有權限才渲染 children", () => {
    ctx.value.sections = notify
    expect(render()).toContain("內容")
  })
  it("沒權限不渲染 children，有可去的區塊時顯示前往", () => {
    ctx.value.sections = voice
    const out = render("notify")
    expect(out).not.toContain("內容")
    expect(out).toContain("正在前往其他區塊")
  })
  it("沒有可去的區塊時停在說明", () => {
    ctx.value.sections = banOnly
    const out = render("notify")
    expect(out).not.toContain("內容")
    expect(out).toContain("目前也沒有其他可使用的區塊")
  })
  it("載入失敗顯示重試", () => {
    ctx.value.failed = true
    const out = render()
    expect(out).toContain("重試")
    expect(out).not.toContain("內容")
  })
})
