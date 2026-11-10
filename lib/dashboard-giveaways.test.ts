import { describe, expect, it } from "vitest"
import { actionErrorText, actionResultText, formatDateTime, participantLabel, statusLabel } from "./dashboard-giveaways"

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

describe("actionErrorText", () => {
  it("已知錯誤碼有對應說明，其餘用通用說明", () => {
    expect(actionErrorText("giveaway_not_ended")).toContain("尚未結束")
    expect(actionErrorText("unknown")).toBe("操作失敗，請稍後再試。")
    expect(actionErrorText(null)).toBe("操作失敗，請稍後再試。")
  })
})

describe("actionResultText", () => {
  it("已結束視為成功", () => {
    expect(actionResultText("end", { status: "already_ended", announce_failure: null, announce_failure_text: null })).toContain(
      "已經結束",
    )
  })
  it("公告成功", () => {
    expect(actionResultText("redraw", { status: "ok", announce_failure: null, announce_failure_text: null })).toBe(
      "已重抽。已在原頻道公告。",
    )
  })
  it("沒有公告時附原因", () => {
    const text = actionResultText("end", {
      status: "ok",
      announce_failure: "channel_missing",
      announce_failure_text: "原頻道已不存在，沒有發出公告",
    })
    expect(text).toBe("已提前結束並開獎。但原頻道已不存在，沒有發出公告。")
  })
})
