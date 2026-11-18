import { afterEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { deletePoll, endPoll, pollActionErrorText, pollActionResultText } from "./dashboard-poll-actions"

const result = (status: "ok" | "already_ended" | "already_deleted", text: string | null = null) => ({
  status,
  message_failure: text ? "forbidden" : null,
  message_failure_text: text,
})

describe("endPoll / deletePoll", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("結算 POST .../end、刪除 DELETE .../polls/{id}", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(result("ok")), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await endPoll("12", 5)
    await deletePoll("12", 5)
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][]
    expect(calls[0][0]).toMatch(/\/dashboard\/guilds\/12\/polls\/5\/end$/)
    expect(calls[0][1].method).toBe("POST")
    expect(calls[1][0]).toMatch(/\/dashboard\/guilds\/12\/polls\/5$/)
    expect(calls[1][1].method).toBe("DELETE")
  })
})

describe("pollActionErrorText", () => {
  it("非發起人", () => {
    expect(pollActionErrorText(new DashboardApiError(403, "not_poll_manager", null, false))).toBe(
      "只有發起人能結算或刪除這個投票。",
    )
  })
  it("404 找不到", () => {
    expect(pollActionErrorText(new DashboardApiError(404, "poll_not_found", null, false))).toBe("找不到這個投票。")
  })
  it("其他錯誤用通用文字", () => {
    expect(pollActionErrorText(new TypeError("x"))).toBe("操作失敗，請稍後再試。")
  })
})

describe("pollActionResultText", () => {
  it("結算成功與訊息更新失敗", () => {
    expect(pollActionResultText("end", result("ok"))).toBe("已結算並更新投票訊息。")
    expect(pollActionResultText("end", result("ok", "星羽沒有權限更新訊息"))).toBe(
      "已結算，但星羽沒有權限更新訊息。",
    )
  })
  it("刪除成功與訊息刪除失敗", () => {
    expect(pollActionResultText("delete", result("ok"))).toBe("已刪除投票與投票訊息。")
    expect(pollActionResultText("delete", result("ok", "訊息沒有刪除"))).toBe("已刪除投票資料，但訊息沒有刪除。")
  })
  it("已結算、已刪除視為成功", () => {
    expect(pollActionResultText("end", result("already_ended"))).toContain("已經結算")
    expect(pollActionResultText("delete", result("already_deleted"))).toContain("已經刪除")
  })
})
