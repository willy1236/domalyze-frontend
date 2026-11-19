import { beforeEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import {
  EVENT_KINDS,
  eventMeta,
  formatConflictField,
  fromConflictValues,
  isDirty,
  parseSaveProblem,
  submitEventOperation,
  toConflictValues,
  valuesOf,
} from "./dashboard-channel-events"

vi.mock("./dashboard-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./dashboard-api")>()),
  dashboardFetch: vi.fn().mockResolvedValue({}),
}))

describe("submitEventOperation", () => {
  const draft = { enabled: true, template: "我舊的自訂文字" }
  const latest = { enabled: false, template: "別人剛改的" }
  beforeEach(() => vi.mocked(dashboardFetch).mockClear())

  it("儲存：PUT 草稿與 original", async () => {
    await submitEventOperation("save", "7", "follow", draft, latest)
    expect(dashboardFetch).toHaveBeenCalledWith("/dashboard/channels/7/event-responses/follow", {
      method: "PUT",
      json: { values: draft, original: latest },
    })
  })
  it("恢復預設撞到衝突後覆蓋：用最新版本當 original 再 DELETE，不送草稿", async () => {
    await submitEventOperation("reset", "7", "follow", draft, latest)
    expect(dashboardFetch).toHaveBeenCalledTimes(1)
    expect(dashboardFetch).toHaveBeenCalledWith("/dashboard/channels/7/event-responses/follow", {
      method: "DELETE",
      json: { original: latest },
    })
  })
})

describe("EVENT_KINDS", () => {
  it("順序與後端的六種事件一致", () => {
    expect(EVENT_KINDS.map((e) => e.kind)).toEqual(["stream_online", "follow", "subscribe", "resubscribe", "gift", "raid"])
  })
  it("續訂與追隨有補充說明", () => {
    expect(eventMeta("resubscribe").note).toContain("續訂訊息")
    expect(eventMeta("follow").note).toContain("10 秒")
  })
  it("不認得的種類退回原字串", () => {
    expect(eventMeta("nope").label).toBe("nope")
  })
})

describe("valuesOf 與 isDirty", () => {
  const response = { enabled: true, template: "感謝 {user}", extra: 1 }
  it("只留可編輯的欄位", () => {
    expect(valuesOf(response)).toEqual({ enabled: true, template: "感謝 {user}" })
  })
  it("開關或文字不同才算改過", () => {
    const base = valuesOf(response)
    expect(isDirty(base, { ...base })).toBe(false)
    expect(isDirty(base, { ...base, enabled: false })).toBe(true)
    expect(isDirty(base, { ...base, template: "x" })).toBe(true)
  })
})

describe("衝突值的轉換", () => {
  it("字串形式與後端一致：文字的欄位名是 response，布林是 true／false", () => {
    expect(toConflictValues({ enabled: false, template: "嗨" })).toEqual({ enabled: "false", response: "嗨" })
  })
  it("轉回表單的值", () => {
    expect(fromConflictValues({ enabled: "true", response: "嗨" })).toEqual({ enabled: true, template: "嗨" })
    expect(fromConflictValues({ enabled: "false", response: null })).toEqual({ enabled: false, template: "" })
  })
  it("顯示文字", () => {
    expect(formatConflictField("enabled", "true")).toBe("開啟")
    expect(formatConflictField("enabled", "false")).toBe("關閉")
    expect(formatConflictField("response", "嗨")).toBe("嗨")
    expect(formatConflictField("response", "")).toBe("無")
  })
})

describe("parseSaveProblem", () => {
  const err = (status: number, code: string, body: Record<string, unknown> = {}) =>
    new DashboardApiError(status, code, { error: code, ...body }, false)

  it("conflict", () => {
    expect(parseSaveProblem(err(409, "conflict", { deleted: false, current: { enabled: "true" } }))).toEqual({
      kind: "conflict",
      current: { enabled: "true" },
    })
  })
  it("欄位問題、AutoMod 與未啟用", () => {
    expect(parseSaveProblem(err(400, "invalid_field", { field: "template", reason: "太長" }))).toEqual({
      kind: "invalid_field",
      field: "template",
      reason: "太長",
    })
    expect(parseSaveProblem(err(422, "automod_blocked"))).toEqual({ kind: "automod_blocked" })
    expect(parseSaveProblem(err(503, "automod_unavailable"))).toEqual({ kind: "automod_unavailable" })
    expect(parseSaveProblem(err(409, "channel_not_enabled"))).toEqual({ kind: "not_enabled" })
  })
  it("其他錯誤回 null", () => {
    expect(parseSaveProblem(err(500, "boom"))).toBeNull()
    expect(parseSaveProblem(new Error("x"))).toBeNull()
  })
})
