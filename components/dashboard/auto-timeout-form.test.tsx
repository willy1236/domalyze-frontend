import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SettingsResponse } from "@/lib/dashboard-settings"

const draft = vi.hoisted(() => ({ stored: null as unknown, consumed: [] as string[] }))
vi.mock("@/lib/dashboard-draft", () => ({
  consumeDraft: (key: string) => {
    draft.consumed.push(key)
    return draft.stored
  },
  registerDraft: () => () => {},
}))

import { AutoTimeoutForm, autoTimeoutDraftKey } from "./auto-timeout-form"

beforeEach(() => {
  draft.stored = null
  draft.consumed = []
})

const settings = (over: Partial<SettingsResponse> = {}): SettingsResponse => ({
  voice_time_counter: false,
  auto_timeout_enabled: true,
  auto_timeout_times: 2,
  auto_timeout_seconds: 5400,
  permission_issues: [],
  leaderboard: [],
  ...over,
})

const render = (s: SettingsResponse) => renderToStaticMarkup(<AutoTimeoutForm guildId="1" settings={s} onSaved={() => {}} />)

describe("AutoTimeoutForm", () => {
  it("帶入目前的次數與時長（取能整除的單位）", () => {
    const out = render(settings())
    expect(out).toContain('value="2"')
    expect(out).toContain('value="90"')
    expect(out).toContain("啟用自動禁言")
  })

  it("已啟用時勾選", () => {
    expect(render(settings())).toMatch(/type="checkbox"[^>]*checked/)
    expect(render(settings({ auto_timeout_enabled: false }))).not.toMatch(/type="checkbox"[^>]*checked/)
  })

  it("bot 缺少 Moderate Members 時顯示警告", () => {
    const out = render(
      settings({ permission_issues: [{ permission: "Moderate Members", scope: "guild", consequence: "無法自動禁言" }] }),
    )
    expect(out).toContain("星羽缺少 Moderate Members 權限")
  })

  it("權限齊全時不顯示警告", () => {
    expect(render(settings())).not.toContain("缺少")
  })

  it("暫存以伺服器區分", () => {
    render(settings())
    expect(draft.consumed).toEqual([autoTimeoutDraftKey("1")])
    expect(autoTimeoutDraftKey("1")).not.toBe(autoTimeoutDraftKey("2"))
  })

  it("從暫存還原未送出的輸入", () => {
    draft.stored = {
      mode: "edit",
      state: {
        original: { auto_timeout_enabled: false, auto_timeout_times: 3, auto_timeout_seconds: 600 },
        enabled: false,
        times: "9",
        amount: "3",
        unit: "h",
      },
    }
    const out = render(settings())
    expect(out).toContain('value="9"')
    expect(out).toContain('value="3"')
    expect(out).not.toMatch(/type="checkbox"[^>]*checked/)
    expect(out).not.toContain('value="90"')
  })
})
