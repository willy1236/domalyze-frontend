import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { CHANNEL_NOTIFY_TYPES, fieldNames, parseSaveProblem } from "./dashboard-channel-notifies"

describe("CHANNEL_NOTIFY_TYPES", () => {
  it("有 12 種且鍵不重複", () => {
    expect(CHANNEL_NOTIFY_TYPES).toHaveLength(12)
    expect(new Set(CHANNEL_NOTIFY_TYPES.map((t) => t.key)).size).toBe(12)
  })

  it("只含打勾的欄位", () => {
    const by = (key: string) => fieldNames(CHANNEL_NOTIFY_TYPES.find((t) => t.key === key)!)
    expect(by("channel:4")).toEqual(["channel_id"])
    expect(by("channel:7")).toEqual(["channel_id", "message"])
    expect(by("channel:1")).toEqual(["channel_id", "role_id"])
  })
})

describe("parseSaveProblem", () => {
  const err = (code: string, body: Record<string, unknown>) => new DashboardApiError(409, code, { error: code, ...body }, false)

  it("conflict", () => {
    expect(parseSaveProblem(err("conflict", { deleted: false, current: { channel_id: "1" } }))).toEqual({
      kind: "conflict",
      deleted: false,
      current: { channel_id: "1" },
    })
    expect(parseSaveProblem(err("conflict", { deleted: true, current: null }))).toEqual({
      kind: "conflict",
      deleted: true,
      current: null,
    })
  })

  it("already_exists 與 invalid_field", () => {
    expect(parseSaveProblem(err("already_exists", { current: { channel_id: "1" } }))?.kind).toBe("already_exists")
    expect(parseSaveProblem(err("invalid_field", { field: "role_id", reason: "x" }))).toEqual({
      kind: "invalid_field",
      field: "role_id",
      reason: "x",
    })
  })

  it("其他錯誤回 null", () => {
    expect(parseSaveProblem(new Error("x"))).toBeNull()
    expect(parseSaveProblem(err("invalid_request", {}))).toBeNull()
  })
})
