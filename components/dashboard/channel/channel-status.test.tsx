import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { ChannelHealth } from "@/lib/dashboard-channel-health"

vi.mock("./channel-access-guard", () => ({ useReloadChannel: () => async () => {} }))

import { ChannelStatus } from "./channel-status"

describe("ChannelStatus", () => {
  it("未啟用顯示「星羽未啟用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="inactive" />)).toContain("星羽未啟用")
  })
  it("已停用顯示「星羽已停用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="disabled" />)).toContain("星羽已停用")
  })
  it("已啟用顯示「星羽已啟用」", () => {
    expect(renderToStaticMarkup(<ChannelStatus state="enabled" />)).toContain("星羽已啟用")
  })
})

describe("ChannelStatus 已停權", () => {
  const banned = renderToStaticMarkup(<ChannelStatus state="banned" channelId="777" />)
  it("顯示停權說明與支援伺服器邀請連結", () => {
    expect(banned).toContain("星羽已停權")
    expect(banned).toContain("此頻道已被停權")
    expect(banned).toContain('href="https://discord.gg/P4jqdcMxkH"')
  })
  it("沒有啟用、重新啟用、停用與修復的按鈕", () => {
    for (const text of ["啟用星羽", "重新啟用", "停用星羽", "修復"]) expect(banned).not.toContain(text)
  })
  it("health 是 banned 時也一樣（state 與判定不同步時以停權為準）", () => {
    const health: ChannelHealth = { state: "banned", issues: [], paused_features: [] }
    const html = renderToStaticMarkup(<ChannelStatus state="disabled" channelId="777" health={health} />)
    expect(html).toContain("此頻道已被停權")
    expect(html).not.toContain("重新啟用")
  })
})

describe("ChannelStatus 的權限問題", () => {
  const render = (health: ChannelHealth) =>
    renderToStaticMarkup(<ChannelStatus state="enabled" channelId="777" health={health} />)
  const partial = (issues: ChannelHealth["issues"], paused: ChannelHealth["paused_features"]): ChannelHealth => ({
    state: "partial",
    issues,
    paused_features: paused,
  })

  it("bot 不是 mod：列出問題、暫停的功能與修復按鈕", () => {
    const html = render(partial(["not_mod"], ["follow_response", "follow_forward"]))
    expect(html).toContain("星羽部分暫停")
    expect(html).toContain("bot 不是 mod")
    expect(html).toContain("追隨回應、追隨轉發")
    expect(html).toContain("修復")
    expect(html).toContain("停用星羽")
  })
  it("授權已失效", () => {
    expect(render(partial(["token_invalid"], ["speech"]))).toContain("授權已失效")
  })
  it("bot 被封鎖：說明要先解除，同時保留修復", () => {
    const html = render(partial(["bot_banned"], ["speech"]))
    expect(html).toContain("解除")
    expect(html).toContain("修復")
  })
  it("只有 bot 離線：顯示問題，不顯示修復與暫停功能，標籤仍是已啟用", () => {
    const html = render({ state: "enabled", issues: ["bot_offline"], paused_features: [] })
    expect(html).toContain("bot 暫時離線")
    expect(html).toContain("星羽已啟用")
    expect(html).not.toContain("修復")
    expect(html).not.toContain("暫停中的功能")
  })
  it("沒有問題就不顯示問題區塊", () => {
    const html = render({ state: "enabled", issues: [], paused_features: [] })
    expect(html).not.toContain('role="status"')
  })
})

describe("ChannelStatus 的 mod", () => {
  it("看得到問題與暫停的功能，沒有修復與停用", () => {
    const health: ChannelHealth = { state: "partial", issues: ["not_mod"], paused_features: ["follow_response"] }
    const html = renderToStaticMarkup(<ChannelStatus state="enabled" channelId="777" health={health} role="mod" />)
    expect(html).toContain("bot 不是 mod")
    expect(html).toContain("暫停中的功能")
    expect(html).toContain("要由實況主按「修復」處理")
    expect(html).not.toContain(">修復</a>")
    expect(html).not.toContain("停用星羽")
  })
  it("未啟用與已停用時沒有啟用的按鈕", () => {
    for (const state of ["inactive", "disabled"] as const) {
      const html = renderToStaticMarkup(<ChannelStatus state={state} channelId="777" role="mod" />)
      expect(html).not.toContain("啟用星羽")
      expect(html).not.toContain("重新啟用")
    }
  })
})
