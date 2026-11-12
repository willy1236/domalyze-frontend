import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { runTicketAction, ticketActionErrorText, ticketRowActions } from "./dashboard-tickets"

let calls: { url: string; method: string }[]

beforeEach(() => {
  calls = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url: url.replace(/^.*\/dashboard/, "/dashboard"), method: init?.method ?? "GET" })
      return { ok: true, status: 200, json: async () => ({ channel_id: "5", status: "locked", changed: false }) } as Response
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("runTicketAction", () => {
  it.each([
    ["lock", "POST", "/dashboard/guilds/1/tickets/channels/5/lock"],
    ["reopen", "POST", "/dashboard/guilds/1/tickets/channels/5/reopen"],
    ["delete", "DELETE", "/dashboard/guilds/1/tickets/channels/5"],
  ] as const)("%s → %s %s", async (action, method, url) => {
    await runTicketAction("1", "5", action)
    expect(calls).toEqual([{ url, method }])
  })

  it("已是要求狀態時照樣回成功（changed: false）", async () => {
    expect((await runTicketAction("1", "5", "lock")).changed).toBe(false)
  })
})

describe("ticketRowActions", () => {
  it("開啟中可鎖定與刪除，已鎖定可重開與刪除", () => {
    expect(ticketRowActions("open")).toEqual(["lock", "delete"])
    expect(ticketRowActions("locked")).toEqual(["reopen", "delete"])
  })
})

describe("ticketActionErrorText", () => {
  it("已知錯誤碼有對應說明，其他用通用說明", () => {
    expect(ticketActionErrorText("bot_missing_permission")).toContain("Manage Roles")
    expect(ticketActionErrorText("not_found")).toContain("找不到")
    expect(ticketActionErrorText(null)).toBe("操作失敗，請稍後再試。")
    expect(ticketActionErrorText("weird")).toBe("操作失敗，請稍後再試。")
  })
})
