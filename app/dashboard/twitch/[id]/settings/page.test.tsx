import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { ChannelRole } from "@/lib/dashboard-channel"

const channel = vi.hoisted(() => ({ role: "owner" as ChannelRole }))
vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777", login: "streamer", role: channel.role }),
}))
vi.mock("@/components/dashboard/channel/delete-data", () => ({ DeleteData: () => <p>刪除所有資料</p> }))

import ChannelSettingsPage from "./page"

describe("頻道設定頁", () => {
  it("實況主看得到刪除所有資料", () => {
    channel.role = "owner"
    expect(renderToStaticMarkup(<ChannelSettingsPage />)).toContain("刪除所有資料")
  })
  it("mod 沒有刪除所有資料", () => {
    channel.role = "mod"
    expect(renderToStaticMarkup(<ChannelSettingsPage />)).not.toContain("刪除所有資料")
  })
})
