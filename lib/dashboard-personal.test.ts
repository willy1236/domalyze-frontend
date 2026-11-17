import { describe, expect, it } from "vitest"
import { type PersonalOverview, accountLabel, isLocked } from "./dashboard-personal"

const base: PersonalOverview = { account: null, partial: false, discords: [] }

describe("個人區", () => {
  it("沒有析域帳號時鎖住工具與公開設定", () => {
    expect(isLocked(base)).toBe(true)
    expect(isLocked({ ...base, account: { username: "willy" } })).toBe(false)
    expect(isLocked({ ...base, account: { username: null } })).toBe(false)
  })
  it("代號暫時查不到時顯示說明", () => {
    expect(accountLabel({ username: "willy" })).toBe("willy")
    expect(accountLabel({ username: null })).toBe("代號暫時無法載入")
  })
})
