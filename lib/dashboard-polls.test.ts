import { describe, expect, it } from "vitest"
import {
  channelLabel,
  formatDateTime,
  hiddenResultsText,
  missingPermissionsText,
  roleLabel,
  statusLabel,
  visibilityLabel,
  voterLabel,
} from "./dashboard-polls"

describe("formatDateTime", () => {
  it("預設台北時區", () => {
    const text = formatDateTime("2026-11-10T09:05:00Z").replace(/[\u2009\u202f\u00a0]/g, " ")
    expect(text).toBe("2026/11/10 17:05")
  })
})

describe("channelLabel", () => {
  it("三種頻道狀態", () => {
    expect(channelLabel({ channel_state: "ok", channel_name: "投票" })).toBe("#投票")
    expect(channelLabel({ channel_state: "unknown", channel_name: null })).toBe("頻道未知")
    expect(channelLabel({ channel_state: "missing", channel_name: null })).toBe("頻道已不存在")
  })
})

describe("missingPermissionsText", () => {
  it("齊全或 null 不警告", () => {
    expect(missingPermissionsText([])).toBeNull()
    expect(missingPermissionsText(null)).toBeNull()
  })
  it("列出缺少的權限與後果", () => {
    const w = missingPermissionsText(["讀取訊息歷史"])
    expect(w?.short).toBe("星羽缺少頻道權限：讀取訊息歷史")
    expect(w?.full).toContain("結算與刪除時會無法更新或刪除投票訊息")
  })
})

describe("hiddenResultsText", () => {
  const counts = [{ option_id: 1, name: "a", count: 1 }]
  it("看得到票數時沒有說明", () => {
    expect(hiddenResultsText({ status: "active", results_visibility: "everyone", counts })).toBeNull()
  })
  it("進行中說明何時公佈", () => {
    expect(hiddenResultsText({ status: "active", results_visibility: "after_end", counts: null })).toBe(
      "結果將在結算後公佈。",
    )
    expect(hiddenResultsText({ status: "active", results_visibility: "creator_only", counts: null })).toContain("僅限發起人")
  })
})

describe("labels", () => {
  it("狀態、可見範圍、身分組、投票人", () => {
    expect(statusLabel("active")).toBe("進行中")
    expect(statusLabel("ended")).toBe("已結算")
    expect(visibilityLabel("after_end")).toBe("結果將在結束時公佈")
    expect(roleLabel({ id: "1", name: null })).toBe("已刪除的身分組")
    expect(voterLabel({ user_id: "7", name: null, left: true })).toBe("已離開的成員（7）")
    expect(voterLabel({ user_id: "7", name: "小明", left: false })).toBe("小明")
    expect(voterLabel({ user_id: "7", name: null, left: false })).toBe("7")
  })
})
