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
  it("mod 協作開關只顯示名稱", () => {
    expect(auditLabels(entry({ target_kind: "mod_collab", target_key: "enabled" })).target).toBe("mod 協作開關")
    expect(auditLabels(entry({ target_kind: "mod_collab", target_key: "other" })).target).toBe("mod 協作開關：other")
  })
  it.each([
    ["moderation", "channel"],
    ["blocked_term", "test word"],
    ["regular", "100"],
    ["stream_info", "title"],
    ["enforcement", "100"],
  ])("修改紀錄類別 %s 顯示中文名稱", (target_kind, target_key) => {
    const { target } = auditLabels(entry({ target_kind, target_key }))
    expect(target).toMatch(/\p{Script=Han}/u)
    expect(target).not.toContain(target_kind)
  })
  it("聊天室管理修改紀錄顯示名稱或實際內容", () => {
    expect(auditLabels(entry({ target_kind: "moderation", target_key: "link" })).target).toBe("聊天室管理設定：連結")
    expect(auditLabels(entry({ target_kind: "moderation", target_key: "channel" })).target).toBe("聊天室管理設定：頻道處罰設定")
    expect(auditLabels(entry({ target_kind: "stream_info", target_key: "category" })).target).toBe("實況資訊：分類")
    expect(auditLabels(entry({ target_kind: "enforcement", target_key: "101", after: { user_name: "Alice" } })).target).toBe("執法紀錄：Alice")
    expect(auditLabels(entry({ target_kind: "blocked_term", target_key: "term-1", before: { text: "bad*" } })).target).toBe("Twitch 禁用詞：bad*")
  })
  it("頻道後台的操作者沒有 id 也能顯示", () => {
    expect(auditLabels(entry({ actor: { platform: "twitch", name: "Ann" } })).actor).toBe("Twitch Ann")
  })
  it("不認得的代碼直接顯示", () => {
    expect(auditLabels(entry({ target_kind: "future", target_key: "k" })).target).toBe("future：k")
  })
})

