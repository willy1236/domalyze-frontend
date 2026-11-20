import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { ChannelRole } from "@/lib/dashboard-channel"

const channel = vi.hoisted(() => ({ role: "owner" as ChannelRole }))
vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777", login: "streamer", role: channel.role, mod_collab_enabled: true }),
  useReloadChannel: () => async () => {},
  useChannelError: () => () => false,
}))
vi.mock("@/components/dashboard/channel/delete-data", () => ({ DeleteData: () => <p>刪除所有資料</p> }))

import ChannelSettingsPage from "./page"

describe("頻道設定頁", () => {
  it("實況主看得到刪除所有資料", () => {
    channel.role = "owner"
    expect(renderToStaticMarkup(<ChannelSettingsPage />)).toContain("刪除所有資料")
  })
  it("實況主的 mod 協作是可切換的開關", () => {
    channel.role = "owner"
    const html = renderToStaticMarkup(<ChannelSettingsPage />)
    expect(html).toContain("mod 協作")
    expect(html).toContain('type="checkbox"')
  })
  it("mod 沒有刪除所有資料，mod 協作只顯示狀態", () => {
    channel.role = "mod"
    const html = renderToStaticMarkup(<ChannelSettingsPage />)
    expect(html).not.toContain("刪除所有資料")
    expect(html).toContain("已開放")
    expect(html).not.toContain('type="checkbox"')
  })
})
