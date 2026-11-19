import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { ChannelTimer } from "@/lib/dashboard-channel-timers"
import { TimerVariables } from "./timer-form"
import { TimerRows } from "./timer-list"

const timer = (over: Partial<ChannelTimer> = {}): ChannelTimer => ({
  id: 1,
  message: "記得追隨",
  interval_minutes: 15,
  min_chat_lines: 10,
  enabled: true,
  updated_at: "2026-11-19T04:00:00+00:00",
  ...over,
})

const noop = () => {}

describe("TimerRows", () => {
  it("沒有計時訊息顯示空狀態", () => {
    expect(renderToStaticMarkup(<TimerRows timers={[]} readOnly={false} onEdit={noop} onToggle={noop} />)).toContain(
      "還沒有計時訊息",
    )
  })
  it("列出訊息、間隔與最少聊天量", () => {
    const html = renderToStaticMarkup(<TimerRows timers={[timer()]} readOnly={false} onEdit={noop} onToggle={noop} />)
    for (const text of ["記得追隨", "每 15 分鐘", "至少 10 則聊天"]) expect(html).toContain(text)
  })
  it("關閉的計時訊息標示已關閉", () => {
    const html = renderToStaticMarkup(
      <TimerRows timers={[timer({ enabled: false })]} readOnly={false} onEdit={noop} onToggle={noop} />,
    )
    expect(html).toContain("已關閉")
  })
  it("頻道沒有啟用時開關與編輯都停用", () => {
    const html = renderToStaticMarkup(<TimerRows timers={[timer()]} readOnly onEdit={noop} onToggle={noop} />)
    expect(html.match(/disabled=""/g)?.length).toBe(2)
  })
})

describe("TimerVariables", () => {
  it("只列計時訊息提供的變數，並說明沒有觸發者的變數不能用", () => {
    const html = renderToStaticMarkup(<TimerVariables />)
    for (const token of ["{channel}", "{uptime}", "{game}", "{title}"]) expect(html).toContain(token)
    expect(html).toContain("不能用")
    expect(html).not.toMatch(/<code[^>]*>\{user\}/)
  })
})
