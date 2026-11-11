import { describe, expect, it } from "vitest"
import { formatDuration, isUserId, kindLabel, memberErrorText, personLabel } from "./dashboard-warnings"

describe("kindLabel", () => {
  it("四種種類的中文名稱", () => {
    expect(["warning", "timeout", "kick", "ban"].map((k) => kindLabel(k as never))).toEqual(["警告", "禁言", "踢出", "停權"])
  })
})

describe("personLabel", () => {
  it("有名稱用名稱", () => {
    expect(personLabel({ id: "1", name: "小明", left: false })).toBe("小明")
  })
  it("已離開的成員標示並附 ID", () => {
    expect(personLabel({ id: "7003", name: null, left: true })).toBe("已離開的成員（7003）")
  })
  it("在伺服器但沒有名稱時退回 ID", () => {
    expect(personLabel({ id: "7003", name: null, left: false })).toBe("7003")
  })
})

describe("formatDuration", () => {
  it("由大到小列出非零的單位", () => {
    expect(formatDuration(7 * 86400)).toBe("7 天")
    expect(formatDuration(5400)).toBe("1 小時 30 分鐘")
    expect(formatDuration(45)).toBe("45 秒")
    expect(formatDuration(600)).toBe("10 分鐘")
    expect(formatDuration(0)).toBe("0 秒")
  })
})

describe("isUserId", () => {
  it("只接受純數字的 ID", () => {
    expect(isUserId("123456789012345678")).toBe(true)
    expect(isUserId(" 123456789012345678 ")).toBe(true)
    expect(isUserId("小明")).toBe(false)
    expect(isUserId("12345")).toBe(false)
  })
})

describe("memberErrorText", () => {
  it("not_member 有專屬提示，其餘用通用說明", () => {
    expect(memberErrorText("not_member")).toContain("不在這個伺服器")
    expect(memberErrorText(null)).toBe("無法載入紀錄，請稍後再試。")
  })
})
