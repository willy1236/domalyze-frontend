import { describe, expect, it } from "vitest"
import { blockReasonLabel, blockSourceLabel } from "./dashboard-channel-automod"

describe("blockSourceLabel", () => {
  it("指令顯示名稱，計時訊息沒有名稱，事件顯示種類", () => {
    expect(blockSourceLabel({ source_kind: "command", source_key: "hi" })).toBe("指令 !hi")
    expect(blockSourceLabel({ source_kind: "timer", source_key: "3" })).toBe("計時訊息")
    expect(blockSourceLabel({ source_kind: "event_response", source_key: "gift" })).toBe("事件回應：贈訂")
  })
  it("不認得的事件種類顯示原始代碼", () => {
    expect(blockSourceLabel({ source_kind: "event_response", source_key: "new_kind" })).toBe("事件回應：new_kind")
  })
})

describe("blockReasonLabel", () => {
  it("區分被擋下與檢查失敗", () => {
    expect(blockReasonLabel("automod")).toBe("被 AutoMod 擋下")
    expect(blockReasonLabel("check_failed")).toContain("檢查失敗")
  })
})
