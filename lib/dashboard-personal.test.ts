import { describe, expect, it } from "vitest"
import { type PersonalOverview, accountLabel, guildListRedirect, isLocked } from "./dashboard-personal"

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

describe("guildListRedirect", () => {
  it("帶 notice 時轉到伺服器清單並保留參數", () => {
    expect(guildListRedirect("?notice=need_permissions")).toBe("/dashboard/guilds?notice=need_permissions")
    expect(guildListRedirect("?notice=invite_pending&x=1")).toBe("/dashboard/guilds?notice=invite_pending&x=1")
  })
  it("沒有 notice 時留在個人區", () => {
    expect(guildListRedirect("")).toBeNull()
    expect(guildListRedirect("?x=1")).toBeNull()
  })
})
