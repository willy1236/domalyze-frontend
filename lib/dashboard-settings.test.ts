import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  autoTimeoutValues,
  formatMinutes,
  parseSettingsProblem,
  splitSeconds,
  toSeconds,
  validateAutoTimeout,
  voiceTimeValues,
  type SettingsResponse,
} from "./dashboard-settings"

const settings: SettingsResponse = {
  voice_time_counter: true,
  auto_timeout_enabled: true,
  auto_timeout_times: 3,
  auto_timeout_seconds: 600,
  permission_issues: [],
  leaderboard: [],
}

describe("formatMinutes", () => {
  it("不滿一小時只顯示分鐘", () => {
    expect(formatMinutes(0)).toBe("0 分鐘")
    expect(formatMinutes(59)).toBe("59 分鐘")
  })
  it("滿一小時顯示小時與分鐘", () => {
    expect(formatMinutes(60)).toBe("1 小時 0 分鐘")
    expect(formatMinutes(135)).toBe("2 小時 15 分鐘")
  })
  it("負數與小數保守處理", () => {
    expect(formatMinutes(-5)).toBe("0 分鐘")
    expect(formatMinutes(61.9)).toBe("1 小時 1 分鐘")
  })
})

describe("表單欄位", () => {
  it("語音時數表單只取自己的欄位", () => {
    expect(voiceTimeValues(settings)).toEqual({ voice_time_counter: true })
  })
  it("自動禁言表單只取自己的欄位", () => {
    expect(autoTimeoutValues(settings)).toEqual({ auto_timeout_enabled: true, auto_timeout_times: 3, auto_timeout_seconds: 600 })
  })
})

describe("禁言時長單位", () => {
  it("取能整除的最大單位", () => {
    expect(splitSeconds(600)).toEqual({ amount: 10, unit: "m" })
    expect(splitSeconds(5400)).toEqual({ amount: 90, unit: "m" })
    expect(splitSeconds(7200)).toEqual({ amount: 2, unit: "h" })
    expect(splitSeconds(604800)).toEqual({ amount: 7, unit: "d" })
  })
  it("不是整分鐘時退回分鐘（無條件捨去）", () => {
    expect(splitSeconds(90)).toEqual({ amount: 1, unit: "m" })
  })
  it("換回秒", () => {
    expect(toSeconds(2, "h")).toBe(7200)
    expect(toSeconds(7, "d")).toBe(604800)
    expect(toSeconds(10, "m")).toBe(600)
  })
})

describe("validateAutoTimeout", () => {
  it("邊界值通過", () => {
    expect(validateAutoTimeout(1, 60)).toBeNull()
    expect(validateAutoTimeout(20, 604800)).toBeNull()
  })
  it("次數超出範圍或不是整數", () => {
    expect(validateAutoTimeout(0, 600)?.field).toBe("times")
    expect(validateAutoTimeout(21, 600)?.field).toBe("times")
    expect(validateAutoTimeout(2.5, 600)?.field).toBe("times")
    expect(validateAutoTimeout(Number.NaN, 600)?.field).toBe("times")
  })
  it("時長超出範圍", () => {
    expect(validateAutoTimeout(3, 59)?.field).toBe("duration")
    expect(validateAutoTimeout(3, 604801)?.field).toBe("duration")
  })
  it("時長須為整分鐘，與後端一致", () => {
    expect(validateAutoTimeout(3, 90)?.field).toBe("duration")
    expect(validateAutoTimeout(3, 3601)?.field).toBe("duration")
    expect(validateAutoTimeout(3, 120)).toBeNull()
  })
})

describe("parseSettingsProblem", () => {
  it("conflict 帶最新值", () => {
    const e = new DashboardApiError(409, "conflict", { deleted: false, current: { auto_timeout_times: 7 } }, false)
    expect(parseSettingsProblem(e)).toEqual({ kind: "conflict", current: { auto_timeout_times: 7 } })
  })
  it("其他錯誤與非 API 錯誤回 null", () => {
    expect(parseSettingsProblem(new DashboardApiError(500, null, null, false))).toBeNull()
    expect(parseSettingsProblem(new Error("x"))).toBeNull()
  })
})
