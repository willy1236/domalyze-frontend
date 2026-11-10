import { describe, expect, it } from "vitest"
import { formatDateTime, participantLabel, statusLabel } from "./dashboard-giveaways"

describe("formatDateTime", () => {
  it("年/月/日 時:分，依指定時區", () => {
    expect(formatDateTime("2026-11-10T09:05:00Z", "Asia/Taipei")).toBe("2026/11/10 17:05")
  })
})

describe("participantLabel", () => {
  it("有名稱用名稱", () => {
    expect(participantLabel({ id: "1", name: "小明", left: false })).toBe("小明")
  })
  it("已離開的成員標示並附 ID", () => {
    expect(participantLabel({ id: "7003", name: null, left: true })).toBe("已離開的成員（7003）")
  })
  it("在伺服器但查不到名稱時退回 ID", () => {
    expect(participantLabel({ id: "7003", name: null, left: false })).toBe("7003")
  })
})

describe("statusLabel", () => {
  it("進行中與已結束", () => {
    expect(statusLabel("active")).toBe("進行中")
    expect(statusLabel("ended")).toBe("已結束")
  })
})
