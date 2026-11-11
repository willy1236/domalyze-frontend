import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { formatMinutes, parseSettingsProblem, settingValues } from "./dashboard-settings"

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

describe("settingValues", () => {
  it("只取可編輯欄位", () => {
    expect(settingValues({ voice_time_counter: true, leaderboard: [] } as never)).toEqual({ voice_time_counter: true })
  })
})

describe("parseSettingsProblem", () => {
  it("conflict 帶最新值", () => {
    const e = new DashboardApiError(409, "conflict", { deleted: false, current: { voice_time_counter: true } }, false)
    expect(parseSettingsProblem(e)).toEqual({ kind: "conflict", current: { voice_time_counter: true } })
  })
  it("其他錯誤與非 API 錯誤回 null", () => {
    expect(parseSettingsProblem(new DashboardApiError(500, null, null, false))).toBeNull()
    expect(parseSettingsProblem(new Error("x"))).toBeNull()
  })
})
