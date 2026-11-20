import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { ForwardGuildOption, ForwardSetting } from "@/lib/dashboard-channel-forward"
import { ForwardFormView } from "./forward-form"

const setting = (over: Partial<ForwardSetting> = {}): ForwardSetting => ({
  editable: true,
  guild: { id: "1", name: "甲" },
  channel: { id: "11", name: "general" },
  ...over,
})

const guilds: ForwardGuildOption[] = [
  { id: "1", name: "甲", icon_url: null, channels: [{ id: "11", name: "general", type: "text" }] },
  { id: "2", name: "乙", icon_url: null, channels: [{ id: "21", name: "news", type: "news" }] },
]

const noop = () => {}

function render(over: Partial<React.ComponentProps<typeof ForwardFormView>> = {}) {
  return renderToStaticMarkup(
    <ForwardFormView
      setting={setting()}
      guilds={guilds}
      draft={{ guildId: "1", channelId: "11" }}
      readOnly={false}
      dirty={false}
      onChange={noop}
      onSave={noop}
      onClear={noop}
      {...over}
    />,
  )
}

describe("ForwardFormView", () => {
  it("顯示目前設定、伺服器選項與所選伺服器的頻道", () => {
    const html = render()
    for (const text of ["目前設定：", "甲 / # general", "選擇伺服器", "乙", "# general", "儲存", "清除設定"]) {
      expect(html).toContain(text)
    }
    expect(html).not.toContain("# news")
  })

  it("沒有設定時提示不會轉發，清除設定不能按", () => {
    const html = render({ setting: setting({ guild: null, channel: null }), draft: { guildId: null, channelId: null } })
    expect(html).toContain("尚未設定，不會轉發")
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>清除設定/)
  })

  it("沒有改動時儲存不能按", () => {
    expect(render({ dirty: false })).toMatch(/<button[^>]*disabled=""[^>]*>儲存/)
    expect(render({ dirty: true })).not.toMatch(/<button[^>]*disabled=""[^>]*>儲存/)
  })

  it("唯讀：只顯示目前設定，沒有選單與按鈕", () => {
    const html = render({ readOnly: true, setting: setting({ editable: false }) })
    expect(html).toContain("甲 / # general")
    for (const text of ["選擇伺服器", "<select", "儲存", "清除設定"]) {
      expect(html).not.toContain(text)
    }
  })

  it("目前的伺服器不在選項內時仍顯示並標註", () => {
    const html = render({ draft: { guildId: "9", channelId: null } })
    expect(html).toContain("9（無法使用）")
  })

  it("沒有可選的伺服器時說明原因", () => {
    expect(render({ guilds: [] })).toContain("管理頻道")
  })

  it("顯示錯誤訊息", () => {
    expect(render({ error: "你在這個伺服器沒有「管理頻道」權限。" })).toContain("沒有「管理頻道」權限")
  })
})
