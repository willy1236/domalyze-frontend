import { describe, expect, it } from "vitest"
import { type AuditEntry, auditLabels } from "./dashboard-audit"

const entry = (patch: Partial<AuditEntry> = {}): AuditEntry => ({
  id: 1,
  at: "2026-01-01T00:00:00+00:00",
  actor: { platform: "discord", id: "111", name: "Owner" },
  source: "dashboard",
  target_kind: "channel",
  target_key: "ban",
  action: "update",
  before: null,
  after: null,
  ...patch,
})

describe("auditLabels", () => {
  it("頻道層級的操作顯示可讀名稱", () => {
    expect(auditLabels(entry()).target).toBe("頻道：停權")
    expect(auditLabels(entry({ target_key: "unban" })).target).toBe("頻道：解除停權")
    expect(auditLabels(entry({ target_key: "all_data", action: "delete" }))).toMatchObject({
      target: "頻道：刪除所有資料",
      action: "刪除",
    })
  })
  it("其他類別顯示類別與 key，來源與操作者帶平台", () => {
    expect(auditLabels(entry({ target_kind: "command", target_key: "hi", source: "chat" }))).toEqual({
      target: "自訂指令：hi",
      action: "修改",
      source: "聊天室",
      actor: "Discord Owner",
    })
  })
  it("不認得的代碼直接顯示", () => {
    expect(auditLabels(entry({ target_kind: "future", target_key: "k" })).target).toBe("future：k")
  })
})

