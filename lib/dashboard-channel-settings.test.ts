import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./dashboard-api", () => ({ dashboardFetch: vi.fn() }))

import { dashboardFetch } from "./dashboard-api"
import {
  DELETE_BOT_NOT_SYNCED,
  DELETE_DONE,
  confirmMatches,
  deleteChannelData,
  deleteNotices,
} from "./dashboard-channel-settings"

describe("confirmMatches", () => {
  it("忽略大小寫與前後空白", () => {
    expect(confirmMatches("Host", "host")).toBe(true)
    expect(confirmMatches(" HOST ", "Host")).toBe(true)
  })
  it("空白或不同名稱不符", () => {
    expect(confirmMatches("", "host")).toBe(false)
    expect(confirmMatches("   ", "host")).toBe(false)
    expect(confirmMatches("hos", "host")).toBe(false)
    expect(confirmMatches("host2", "host")).toBe(false)
  })
})

describe("deleteChannelData", () => {
  beforeEach(() => vi.mocked(dashboardFetch).mockReset())

  it("POST 到 delete-data 並帶 confirm_login", async () => {
    vi.mocked(dashboardFetch).mockResolvedValue({ state: "inactive", bot_offline: false })
    await deleteChannelData("123", "Host")
    expect(dashboardFetch).toHaveBeenCalledWith("/dashboard/channels/123/delete-data", {
      method: "POST",
      json: { confirm_login: "Host" },
    })
  })
})

describe("deleteNotices", () => {
  it("星羽離線時多一則提示", () => {
    expect(deleteNotices({ state: "inactive", bot_offline: false })).toEqual([DELETE_DONE])
    expect(deleteNotices({ state: "inactive", bot_offline: true })).toEqual([DELETE_DONE, DELETE_BOT_NOT_SYNCED])
  })
})
