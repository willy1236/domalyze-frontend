import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { ChannelCommand } from "@/lib/dashboard-channel-commands"
import { CommandRows } from "./command-list"
import { CommandVariables } from "./command-form"

const command = (over: Partial<ChannelCommand> = {}): ChannelCommand => ({
  name: "hi",
  response: "哈囉 {user}",
  aliases: ["h"],
  enabled: true,
  global_cooldown: 30,
  user_cooldown: 0,
  permission: "everyone",
  use_count: 3,
  updated_at: "2026-11-19T04:00:00+00:00",
  ...{ builtin_conflict: null },
  ...over,
})

const noop = () => {}

describe("CommandRows", () => {
  it("沒有指令顯示空狀態", () => {
    expect(renderToStaticMarkup(<CommandRows commands={[]} readOnly={false} onEdit={noop} onToggle={noop} />)).toContain(
      "還沒有自訂指令",
    )
  })
  it("列出名稱、回應、別名、權限、冷卻與使用次數", () => {
    const html = renderToStaticMarkup(
      <CommandRows commands={[command({ permission: "mod" })]} readOnly={false} onEdit={noop} onToggle={noop} />,
    )
    for (const text of ["!hi", "哈囉 {user}", "別名 !h", "權限：mod", "全體冷卻 30 秒", "已使用 3 次"]) {
      expect(html).toContain(text)
    }
  })
  it("關閉的指令標示已關閉", () => {
    const html = renderToStaticMarkup(
      <CommandRows commands={[command({ enabled: false })]} readOnly={false} onEdit={noop} onToggle={noop} />,
    )
    expect(html).toContain("已關閉")
    expect(html).not.toContain("checked")
  })
  it("被改名的自訂指令旁顯示原名與改名原因", () => {
    const renamed = {
      ...command({ name: "oldcommand", aliases: [] }),
      builtin_conflict: { renamed_from: "uptime", removed_aliases: [] },
    }
    const html = renderToStaticMarkup(
      <CommandRows commands={[renamed]} readOnly={false} onEdit={noop} onToggle={noop} />,
    )
    expect(html).toContain("!oldcommand")
    expect(html).toContain("原名 !uptime，因與內建指令同名已改名")
  })
  it("只有別名被移除時，保留指令名稱並顯示被移除的別名", () => {
    const withoutAlias = {
      ...command({ aliases: ["h"] }),
      builtin_conflict: { renamed_from: null, removed_aliases: ["title"] },
    }
    const html = renderToStaticMarkup(
      <CommandRows commands={[withoutAlias]} readOnly={false} onEdit={noop} onToggle={noop} />,
    )
    expect(html).toContain("!hi")
    expect(html).toContain("別名 !title 因與內建指令同名已移除")
    expect(html).not.toContain("原名")
  })
  it("儲存後重載回傳 null 時不顯示改名提示", () => {
    const saved = { ...command({ name: "oldcommand" }), builtin_conflict: null }
    const html = renderToStaticMarkup(
      <CommandRows commands={[saved]} readOnly={false} onEdit={noop} onToggle={noop} />,
    )
    expect(html).toContain("!oldcommand")
    expect(html).not.toContain("原名")
    expect(html).not.toContain("因與內建指令同名")
  })
  it("星羽沒啟用時開關與編輯按鈕都停用", () => {
    const html = renderToStaticMarkup(<CommandRows commands={[command()]} readOnly onEdit={noop} onToggle={noop} />)
    expect(html.match(/disabled=""/g)).toHaveLength(2)
  })
  it("可以修改時開關與編輯按鈕可用", () => {
    const html = renderToStaticMarkup(<CommandRows commands={[command()]} readOnly={false} onEdit={noop} onToggle={noop} />)
    expect(html).not.toContain(`disabled=""`)
  })
})

describe("CommandVariables", () => {
  it("列出全部變數", () => {
    const html = renderToStaticMarkup(<CommandVariables />)
    for (const token of ["{user}", "{touser}", "{args}", "{count}", "{channel}", "{uptime}", "{game}", "{title}"]) {
      expect(html).toContain(token)
    }
  })
})
