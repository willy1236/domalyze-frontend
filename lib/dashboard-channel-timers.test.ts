import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  atTimerLimit,
  type ChannelTimer,
  EMPTY_TIMER,
  formatConflictField,
  fromConflictValues,
  parseSaveProblem,
  TIMERS_MAX,
  timerSummary,
  toConflictValues,
  valuesOf,
} from "./dashboard-channel-timers"

const timer: ChannelTimer = {
  id: 3,
  message: "記得追隨 {channel}",
  interval_minutes: 15,
  min_chat_lines: 10,
  enabled: false,
  updated_at: "2026-11-19T04:00:00+00:00",
}

describe("valuesOf", () => {
  it("只留可編輯的欄位，不含 id 與更新時間", () => {
    expect(Object.keys(valuesOf(timer)).sort()).toEqual(Object.keys(EMPTY_TIMER).sort())
  })
})

describe("衝突值的轉換", () => {
  it("字串形式與後端一致：數字轉字串，布林是 true／false", () => {
    expect(toConflictValues(valuesOf(timer))).toEqual({
      message: "記得追隨 {channel}",
      interval_minutes: "15",
      min_chat_lines: "10",
      enabled: "false",
    })
  })
  it("轉回表單的值", () => {
    const values = valuesOf(timer)
    expect(fromConflictValues(toConflictValues(values))).toEqual(values)
  })
})

describe("formatConflictField", () => {
  it.each([
    ["enabled", "true", "開啟"],
    ["enabled", "false", "關閉"],
    ["interval_minutes", "15", "15 分鐘"],
    ["min_chat_lines", "10", "10 則"],
    ["message", "x", "x"],
    ["message", null, "無"],
    ["message", "", "無"],
  ])("%s %s → %s", (field, value, expected) => {
    expect(formatConflictField(field, value)).toBe(expected)
  })
})

describe("timerSummary", () => {
  it("顯示間隔與最少聊天量", () => {
    expect(timerSummary(valuesOf(timer))).toBe("每 15 分鐘 · 至少 10 則聊天")
    expect(timerSummary({ ...valuesOf(timer), min_chat_lines: 0 })).toBe("每 15 分鐘 · 不限聊天量")
  })
})

describe("數量上限", () => {
  it("達到每個頻道 20 則就不能再新增", () => {
    expect(TIMERS_MAX).toBe(20)
    expect(atTimerLimit(19)).toBe(false)
    expect(atTimerLimit(20)).toBe(true)
  })
})

describe("parseSaveProblem", () => {
  const error = (code: string, body: Record<string, unknown> = {}) => new DashboardApiError(400, code, body, false)

  it("衝突：已被刪除時 current 為 null", () => {
    expect(parseSaveProblem(error("conflict", { deleted: true, current: null }))).toEqual({
      kind: "conflict",
      deleted: true,
      current: null,
    })
  })
  it("欄位不合法：含數量上限的 limit", () => {
    expect(parseSaveProblem(error("invalid_field", { field: "limit", reason: "最多 20 則" }))).toEqual({
      kind: "invalid_field",
      field: "limit",
      reason: "最多 20 則",
    })
    expect(parseSaveProblem(error("invalid_field", {}))).toBeNull()
  })
  it("AutoMod 與未啟用", () => {
    expect(parseSaveProblem(error("automod_blocked"))).toEqual({ kind: "automod_blocked" })
    expect(parseSaveProblem(error("automod_unavailable"))).toEqual({ kind: "automod_unavailable" })
    expect(parseSaveProblem(error("channel_not_enabled"))).toEqual({ kind: "not_enabled" })
  })
  it("其他錯誤回 null", () => {
    expect(parseSaveProblem(error("other"))).toBeNull()
    expect(parseSaveProblem(new Error("x"))).toBeNull()
  })
})
