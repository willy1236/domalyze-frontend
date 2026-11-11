import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ReactionRoleItem } from "./reaction-role-section"
import type { ReactionRoleMessage } from "@/lib/dashboard-reaction-roles"

const ok: ReactionRoleMessage = {
  message_id: "9",
  channel: { id: "5", name: "身分組", invalid: false },
  invalid: false,
  summary: "請選身分組",
  jump_url: "https://discord.com/channels/1/5/9",
  buttons: [
    { role: { id: "1", name: "活動", invalid: false }, title: "活動通知", emoji: "🎉", emoji_invalid: false, style: 1 },
  ],
  permission_issues: [],
}

const render = (m: ReactionRoleMessage, actions?: React.ReactNode) =>
  renderToStaticMarkup(<ReactionRoleItem message={m} actions={actions} />)

describe("ReactionRoleItem", () => {
  it("顯示頻道、摘要、按鈕、身分組與原訊息連結，沒有警告", () => {
    const out = render(ok)
    for (const t of ["#身分組", "請選身分組", "🎉", "活動通知", "@活動", 'href="https://discord.com/channels/1/5/9"']) {
      expect(out).toContain(t)
    }
    expect(out).not.toContain("已失效")
    expect(out).not.toContain("失效：")
    expect(out).not.toContain("bot 缺少")
  })

  it("整則失效：訊息被刪", () => {
    const out = render({ ...ok, invalid: true, summary: null })
    expect(out).toContain("已失效")
    expect(out).toContain("訊息已被刪除")
    expect(out).toContain("讀不到訊息內容")
  })

  it("整則失效：頻道被刪", () => {
    const out = render({ ...ok, invalid: true, summary: null, channel: { id: "5", name: null, invalid: true } })
    expect(out).toContain("頻道已不存在")
    expect(out).toContain("頻道已被刪除")
  })

  it("按鈕失效：身分組被刪與 emoji 失效", () => {
    const out = render({
      ...ok,
      buttons: [
        { role: { id: "2", name: null, invalid: true }, title: "壞按鈕", emoji: "<:gone:700000000000002>", emoji_invalid: true, style: 1 },
      ],
    })
    expect(out).toContain("身分組已被刪除")
    expect(out).toContain("自訂 emoji 已不存在")
    expect(out).toContain("身分組 2")
    expect(out).toContain(":gone:")
  })

  it("bot 權限警告列出權限與後果", () => {
    const out = render({
      ...ok,
      permission_issues: [{ permission: "Manage Roles", scope: "guild", consequence: "按下按鈕無法給予或移除身分組" }],
    })
    expect(out).toContain("Manage Roles")
    expect(out).toContain("按下按鈕無法給予或移除身分組")
  })

  it("沒有按鈕與沒有文字的說明", () => {
    const out = render({ ...ok, buttons: [], summary: "" })
    expect(out).toContain("沒有任何按鈕")
    expect(out).toContain("沒有文字內容")
  })

  it("actions 插槽會渲染", () => {
    expect(render(ok, <button>編輯</button>)).toContain("編輯")
  })
})
