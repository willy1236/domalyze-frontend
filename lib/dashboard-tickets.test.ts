import { describe, expect, it } from "vitest"
import { limitSummary, lobbyInvalidMessage, memberLabel, targetLabel } from "./dashboard-tickets"

describe("lobbyInvalidMessage", () => {
  it("沒有失效回 null", () => {
    expect(lobbyInvalidMessage(null)).toBeNull()
  })

  it("三種失效原因各有說明", () => {
    expect(lobbyInvalidMessage("channel_deleted")).toContain("大廳頻道")
    expect(lobbyInvalidMessage("category_deleted")).toContain("重新選分類")
    expect(lobbyInvalidMessage("message_deleted")).toContain("大廳訊息")
  })
})

describe("targetLabel", () => {
  it("分類與大廳頻道", () => {
    expect(targetLabel("category")).toBe("私人頻道所在分類")
    expect(targetLabel("lobby_channel")).toBe("大廳頻道")
  })
})

describe("memberLabel", () => {
  it("有名稱顯示名稱，離開伺服器顯示 ID，沒有資料顯示未知", () => {
    expect(memberLabel({ id: "1", name: "小明" })).toBe("小明")
    expect(memberLabel({ id: "2", name: null })).toBe("2（已離開伺服器）")
    expect(memberLabel(null)).toBe("未知")
  })
})

describe("limitSummary", () => {
  it("預設：每人一張、不限上限", () => {
    expect(limitSummary({ one_per_user: true, max_open: null })).toBe("每人一張，不限同時開啟上限")
  })

  it("每人不限張數與上限", () => {
    expect(limitSummary({ one_per_user: false, max_open: 5 })).toBe("每人不限張數，同時開啟上限 5 張")
  })
})
