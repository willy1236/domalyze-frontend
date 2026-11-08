import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { COMMUNITY_NOTIFY_TYPES, parseCommunityProblem, typesOf } from "./dashboard-community-notifies"

const err = (code: string, body: Record<string, unknown>) => new DashboardApiError(409, code, { error: code, ...body }, false)

describe("COMMUNITY_NOTIFY_TYPES", () => {
  it("5 種，Twitter 沒有自訂文字，Twitch 有三種", () => {
    expect(COMMUNITY_NOTIFY_TYPES).toHaveLength(5)
    expect(typesOf("twitch")).toHaveLength(3)
    expect(typesOf("twitter")[0].hasMessage).toBe(false)
  })
})

describe("parseCommunityProblem", () => {
  it("already_exists 帶已存在的種類與目前的值", () => {
    expect(
      parseCommunityProblem(err("already_exists", { existing: ["community:1"], current: { "community:1": { channel_id: "1" } } })),
    ).toEqual({ kind: "already_exists", existing: ["community:1"], current: { "community:1": { channel_id: "1" } } })
  })

  it("resolve_failed 只接受已知原因", () => {
    expect(parseCommunityProblem(err("resolve_failed", { reason: "not_found" }))).toEqual({ kind: "resolve_failed", reason: "not_found" })
    expect(parseCommunityProblem(err("resolve_failed", { reason: "weird" }))).toBeNull()
  })

  it("conflict 與 invalid_field", () => {
    expect(parseCommunityProblem(err("conflict", { deleted: true, current: null }))).toEqual({
      kind: "conflict",
      deleted: true,
      current: null,
    })
    expect(parseCommunityProblem(err("invalid_field", { field: "role_id", reason: "x" }))?.kind).toBe("invalid_field")
  })

  it("其他錯誤回 null", () => {
    expect(parseCommunityProblem(new Error("x"))).toBeNull()
  })
})
