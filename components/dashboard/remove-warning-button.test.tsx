import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { WarningRecord } from "@/lib/dashboard-warnings"

const ctx = vi.hoisted(() => ({ actions: [] as string[] }))
vi.mock("@/components/dashboard/guild-sections", () => ({
  useGuildSections: () => ({
    sections: null,
    failed: false,
    can: (_section: string, action = "view") => ctx.actions.includes(action),
    reload: () => {},
  }),
}))

import { RemoveWarningButton } from "./remove-warning-button"

const record = (thisGuild: boolean): WarningRecord => ({
  id: 7,
  kind: "ban",
  target: { id: "2", name: "Alice", avatar_url: null, left: false },
  moderator: { id: "1", name: "Admin", avatar_url: null, left: false },
  reason: "r",
  created_at: "2026-11-11T00:00:00+00:00",
  duration_seconds: null,
  cross_guild: false,
  this_guild: thisGuild,
  sheet: { title: null, description: null },
})

const render = (actions: string[], thisGuild = true) => {
  ctx.actions = actions
  return renderToStaticMarkup(<RemoveWarningButton guildId="1" record={record(thisGuild)} reload={() => {}} />)
}

describe("RemoveWarningButton", () => {
  it("沒有移除權限時不顯示", () => {
    expect(render(["view", "timeout"])).toBe("")
  })

  it("其他伺服器發出的紀錄不顯示", () => {
    expect(render(["view", "remove"], false)).toBe("")
  })

  it("有權限且是本伺服器的紀錄時顯示按鈕與確認視窗，說明不解除停權", () => {
    const out = render(["view", "remove"])
    expect(out).toContain("移除")
    expect(out).toContain("確認移除")
    expect(out).toContain("不會解除")
  })
})
