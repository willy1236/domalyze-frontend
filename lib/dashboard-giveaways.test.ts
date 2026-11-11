import { describe, expect, it } from "vitest"
import {
  actionErrorText,
  actionResultText,
  formatDateTime,
  missingPermissionsText,
  participantLabel,
  statusLabel,
} from "./dashboard-giveaways"

describe("formatDateTime", () => {
  it("年/月/日 時:分，依指定時區", () => {
    // Intl 在部分環境會用 thin space / NNBSP 等字元當時分分隔
    const text = formatDateTime("2026-11-10T09:05:00Z", "Asia/Taipei").replace(/[\u2009\u202f\u00a0]/g, " ")
    expect(text).toBe("2026/11/10 17:05")
  })
})

describe("participantLabel", () => {
  it("有名稱用名稱", () => {
    expect(participantLabel({ id: "1", name: "小明", left: false })).toBe("小明")
  })
  it("已離開的成員標示並附 ID", () => {
    expect(participantLabel({ id: "7003", name: null, left: true })).toBe("已離開的成員（7003）")
  })
  it("已離開即使仍有名稱也標示已離開", () => {
    expect(participantLabel({ id: "7003", name: "舊名", left: true })).toBe("已離開的成員（7003）")
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
    expect(
      actionResultText("end", {
        status: "already_ended",
        announce_failure: null,
        announce_failure_text: null,
        no_replacement: false,
      }),
    ).toContain("已經結束")
  })
  it("公告成功", () => {
    expect(
      actionResultText("redraw", {
        status: "ok",
        announce_failure: null,
        announce_failure_text: null,
        no_replacement: false,
      }),
    ).toBe("已重抽。已在原頻道公告。")
  })
  it("沒有公告時附原因", () => {
    const text = actionResultText("end", {
      status: "ok",
      announce_failure: "channel_missing",
      announce_failure_text: "原頻道已不存在，沒有發出公告",
      no_replacement: false,
    })
    expect(text).toBe("已提前結束並開獎。但原頻道已不存在，沒有發出公告。")
  })
  it("重抽沒有可替補的參加者", () => {
    expect(
      actionResultText("redraw", {
        status: "ok",
        announce_failure: null,
        announce_failure_text: null,
        no_replacement: true,
      }),
    ).toBe("已重抽，但沒有可替補的參加者。")
  })
})

describe("missingPermissionsText", () => {
  it("權限齊全或頻道已不存在時不警告", () => {
    expect(missingPermissionsText([])).toBeNull()
    expect(missingPermissionsText(null)).toBeNull()
  })
  it("列出缺少的權限", () => {
    expect(missingPermissionsText(["檢視頻道", "讀取訊息歷史"])).toEqual({
      short: "星羽缺少頻道權限：檢視頻道、讀取訊息歷史",
      full: "星羽在此頻道缺少：檢視頻道、讀取訊息歷史。開獎與重抽時會無法更新抽獎訊息與公告中獎者，請到頻道設定補上權限。",
    })
  })
})
