import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { estimatedRoomNameLength, normalizeTemplate, parseLobbyProblem, previewRoomName, templateTooLong } from "./dashboard-dynamic-voice"

describe("estimatedRoomNameLength", () => {
  it("{member} 以 32 個字元計，留空回 0，emoji 算一個字元", () => {
    expect(estimatedRoomNameLength("{member} 的房間")).toBe(36)
    expect(estimatedRoomNameLength("   ")).toBe(0)
    expect(estimatedRoomNameLength("🎮")).toBe(1)
  })
})

describe("templateTooLong", () => {
  it("{member} 以 32 個字元估算：加 68 個字元可存，69 個不行", () => {
    expect(templateTooLong("{member}" + "x".repeat(68))).toBe(false)
    expect(templateTooLong("{member}" + "x".repeat(69))).toBe(true)
  })

  it("沒有 {member} 就直接算字元數，空白視為未設定", () => {
    expect(templateTooLong("x".repeat(100))).toBe(false)
    expect(templateTooLong("x".repeat(101))).toBe(true)
    expect(templateTooLong("   ")).toBe(false)
  })

  it("以 code point 計數，與 Python len 一致", () => {
    expect(templateTooLong("😀".repeat(100))).toBe(false)
    expect(templateTooLong("😀".repeat(101))).toBe(true)
  })

  it("每個 {member} 都代入 32 個字元", () => {
    expect(templateTooLong("{member}{member}{member}{member}")).toBe(true)
    expect(templateTooLong("{member}{member}{member}")).toBe(false)
  })
})

describe("previewRoomName", () => {
  it("代入 username", () => {
    expect(previewRoomName("{member} 的房間", "willy")).toBe("willy 的房間")
  })

  it("留空是「<username>的頻道」", () => {
    expect(previewRoomName("  ", "willy")).toBe("willy的頻道")
  })

  it("取不到 username 時用「使用者名稱」", () => {
    expect(previewRoomName("{member} 的房間", null)).toBe("使用者名稱 的房間")
    expect(previewRoomName("", null)).toBe("使用者名稱的頻道")
  })
})

describe("normalizeTemplate", () => {
  it("去頭尾空白，空字串回 null", () => {
    expect(normalizeTemplate("  a ")).toBe("a")
    expect(normalizeTemplate("   ")).toBeNull()
  })
})

describe("parseLobbyProblem", () => {
  const err = (code: string, body: Record<string, unknown>) => new DashboardApiError(409, code, { error: code, ...body }, false)

  it("conflict", () => {
    expect(parseLobbyProblem(err("conflict", { deleted: false, current: { channel_id: "1", template: "a" } }))).toEqual({
      kind: "conflict",
      deleted: false,
      current: { channel_id: "1", template: "a" },
    })
    expect(parseLobbyProblem(err("conflict", { deleted: true, current: null }))).toEqual({
      kind: "conflict",
      deleted: true,
      current: null,
    })
  })

  it("already_exists 與 invalid_request", () => {
    expect(parseLobbyProblem(err("already_exists", { current: { channel_id: "1", template: null } }))?.kind).toBe("already_exists")
    expect(parseLobbyProblem(err("invalid_request", { field: "template" }))).toEqual({ kind: "invalid_field", field: "template" })
  })

  it("其他錯誤回 null", () => {
    expect(parseLobbyProblem(new Error("x"))).toBeNull()
    expect(parseLobbyProblem(err("invalid_request", {}))).toBeNull()
  })
})
