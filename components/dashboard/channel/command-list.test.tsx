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
  it("bot 沒啟用時開關與編輯按鈕都停用", () => {
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
