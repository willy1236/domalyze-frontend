import { describe, expect, it } from "vitest"
import { type WeekStats, formatRate } from "./dashboard-ops-website"

const week: WeekStats = { week_start: "2026-11-09", accounts: 3, linked: 1, pending: 0, clicks: 0, rate: 1 / 3 }

describe("formatRate", () => {
  it("四捨五入到整數百分比", () => {
    expect(formatRate(week)).toBe("33%")
  })

  it("尚未結算顯示 -", () => {
    expect(formatRate({ ...week, pending: 2, rate: null })).toBe("-")
  })
})
