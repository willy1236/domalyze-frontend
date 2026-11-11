import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { SettingsResponse } from "@/lib/dashboard-settings"
import { AutoTimeoutForm } from "./auto-timeout-form"

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
})
