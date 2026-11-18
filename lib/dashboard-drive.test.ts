import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { failureText, gmailHint, normalizeGmail } from "./dashboard-drive"

describe("normalizeGmail", () => {
  it("只輸入帳號時補上 @gmail.com", () => {
    expect(normalizeGmail("abc")).toBe("abc@gmail.com")
    expect(normalizeGmail(" abc ")).toBe("abc@gmail.com")
  })
  it("完整的 gmail 不分大小寫都接受", () => {
    expect(normalizeGmail("abc@gmail.com")).toBe("abc@gmail.com")
    expect(normalizeGmail("ABC@GMAIL.COM")).toBe("ABC@GMAIL.COM")
  })
  it("其他網域或格式不符回 null", () => {
    for (const v of ["abc@yahoo.com", "a b", "", "@gmail.com", "a@b@gmail.com", "abc@gmail.com.tw"]) {
      expect(normalizeGmail(v)).toBeNull()
    }
  })
})

describe("gmailHint", () => {
  it("空白不提示，不符時提示，符合時不提示", () => {
    expect(gmailHint("")).toBeNull()
    expect(gmailHint("abc@yahoo.com")).toContain("Gmail")
    expect(gmailHint("abc")).toBeNull()
  })
})

describe("failureText", () => {
  it("依錯誤碼顯示原因，且說明原設定不變", () => {
    expect(failureText(new DashboardApiError(502, "drive_failed", null, false))).toContain("沒有改變")
    expect(failureText(new DashboardApiError(400, "invalid_gmail", null, false))).toContain("格式")
  })
  it("wrapper 已處理的錯誤不再顯示", () => {
    expect(failureText(new DashboardApiError(401, "session_expired", null, true))).toBeNull()
  })
  it("未知錯誤用通用說明", () => {
    expect(failureText(new Error("x"))).toContain("沒有改變")
  })
})
