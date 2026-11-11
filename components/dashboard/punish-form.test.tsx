import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

const ctx = vi.hoisted(() => ({ actions: [] as string[] }))
vi.mock("@/components/dashboard/guild-sections", () => ({
  useGuildSections: () => ({
    sections: null,
    failed: false,
    can: (_section: string, action = "view") => ctx.actions.includes(action),
    reload: () => {},
  }),
}))

import { PunishForm } from "./punish-form"

const render = (actions: string[]) => {
  ctx.actions = actions
  return renderToStaticMarkup(<PunishForm guildId="1" reload={() => {}} />)
}

describe("PunishForm", () => {
  it("只有檢視權限時不顯示按鈕與表單", () => {
    expect(render(["view"])).toBe("")
  })

  it("只列出有權限的種類分頁", () => {
    const out = render(["view", "add", "ban"])
    expect(out).toContain("新增懲處")
    expect(out).toContain(">警告<")
    expect(out).toContain(">停權<")
    expect(out).not.toContain(">禁言<")
    expect(out).not.toContain(">踢出<")
  })

  it("預設分頁是第一個有權限的種類，只有停權權限時沒有警告分頁", () => {
    const out = render(["view", "ban"])
    expect(out).not.toContain(">警告<")
    expect(out).toContain("執行停權")
  })

  it("禁言分頁有時長與刪訊息選項，並提示只能選伺服器內成員", () => {
    const out = render(["view", "timeout"])
    expect(out).toContain("禁言時長")
    expect(out).toContain("刪除對象最近的訊息")
    expect(out).toContain("只能選伺服器內的成員")
  })

  it("警告分頁沒有時長與刪訊息選項", () => {
    const out = render(["view", "add"])
    expect(out).not.toContain("禁言時長")
    expect(out).not.toContain("刪除對象最近的訊息")
  })
})
