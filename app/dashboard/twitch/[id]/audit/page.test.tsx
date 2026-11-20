import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { AuditEntriesPage } from "@/lib/dashboard-audit"

const load = vi.hoisted(() => ({ value: { data: null as AuditEntriesPage | null, failed: false } }))
vi.mock("@/lib/use-load", () => ({ useLoad: () => load.value }))
vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777" }),
  useChannelError: () => () => false,
}))

import ChannelAuditPage from "./page"

describe("頻道修改紀錄頁", () => {
  it("列出操作者、來源與修改前後", () => {
    load.value = {
      failed: false,
      data: {
        page: 1,
        has_next: false,
        entries: [
          {
            id: 1,
            at: "2026-01-01T00:00:00+00:00",
            actor: { platform: "twitch", name: "Ann" },
            source: "chat",
            target_kind: "command",
            target_key: "hi",
            action: "create",
            before: null,
            after: { response: "hello" },
          },
        ],
      },
    }
    const html = renderToStaticMarkup(<ChannelAuditPage />)
    expect(html).toContain("Twitch Ann")
    expect(html).toContain("聊天室")
    expect(html).toContain("自訂指令：hi")
    expect(html).toContain("hello")
  })
  it("沒有紀錄時顯示空的說明", () => {
    load.value = { failed: false, data: { page: 1, has_next: false, entries: [] } }
    expect(renderToStaticMarkup(<ChannelAuditPage />)).toContain("還沒有修改紀錄")
  })
  it("載入失敗顯示錯誤", () => {
    load.value = { failed: true, data: null }
    expect(renderToStaticMarkup(<ChannelAuditPage />)).toContain("無法載入修改紀錄")
  })
})
