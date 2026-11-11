import { describe, expect, it } from "vitest"
import {
  allowedKinds,
  allowsIdOnly,
  buildPunishRequest,
  formatDuration,
  isUserId,
  kindLabel,
  memberErrorText,
  personLabel,
  punishErrorText,
  punishResultLines,
  validatePunish,
  type PunishDraft,
  type PunishResponse,
} from "./dashboard-warnings"

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

const draft = (over: Partial<PunishDraft> = {}): PunishDraft => ({
  kind: "warning",
  userId: "8002",
  reason: "吵架",
  crossGuild: false,
  durationSeconds: 600,
  deleteMessageSeconds: 0,
  announceChannelId: "",
  ...over,
})

describe("allowedKinds", () => {
  it("只列出有權限的種類，順序固定", () => {
    expect(allowedKinds((a) => a === "ban" || a === "add")).toEqual(["warning", "ban"])
    expect(allowedKinds(() => false)).toEqual([])
    expect(allowedKinds(() => true)).toEqual(["warning", "timeout", "kick", "ban"])
  })
})

describe("allowsIdOnly", () => {
  it("警告與停權可填 ID，禁言與踢出不行", () => {
    expect(["warning", "timeout", "kick", "ban"].map((k) => allowsIdOnly(k as never))).toEqual([true, false, false, true])
  })
})

describe("validatePunish", () => {
  it("合規的草稿沒有錯誤", () => {
    expect(validatePunish(draft(), "1")).toEqual({})
  })
  it("沒選對象、選到自己", () => {
    expect(validatePunish(draft({ userId: null }), "1").user).toBeDefined()
    expect(validatePunish(draft({ userId: "1" }), "1").user).toBe("不能對自己執行")
  })
  it("警告與停權必填原因，空白不算", () => {
    expect(validatePunish(draft({ reason: "   " }), null).reason).toBe("請填寫原因")
    expect(validatePunish(draft({ kind: "ban", reason: "" }), null).reason).toBe("請填寫原因")
  })
  it("禁言與踢出的原因可以不填", () => {
    expect(validatePunish(draft({ kind: "kick", reason: "" }), null)).toEqual({})
    expect(validatePunish(draft({ kind: "timeout", reason: "" }), null)).toEqual({})
  })
  it("原因 100 字內可以，101 字不行", () => {
    expect(validatePunish(draft({ reason: "字".repeat(100) }), null)).toEqual({})
    expect(validatePunish(draft({ reason: "字".repeat(101) }), null).reason).toContain("100")
  })
  it("禁言時長要在選項內", () => {
    expect(validatePunish(draft({ kind: "timeout", durationSeconds: 5 }), null).duration).toBeDefined()
  })
})

describe("buildPunishRequest", () => {
  it("警告只帶共通欄位並去掉原因前後空白", () => {
    expect(buildPunishRequest(draft({ reason: " 吵架 ", crossGuild: true }))).toEqual({
      kind: "warning",
      user_id: "8002",
      reason: "吵架",
      cross_guild: true,
    })
  })
  it("禁言帶時長與刪訊息秒數（0 不送）", () => {
    expect(buildPunishRequest(draft({ kind: "timeout", durationSeconds: 3600 })).delete_message_seconds).toBeUndefined()
    const body = buildPunishRequest(draft({ kind: "timeout", durationSeconds: 3600, deleteMessageSeconds: 86400 }))
    expect(body.duration_seconds).toBe(3600)
    expect(body.delete_message_seconds).toBe(86400)
  })
  it("警告與踢出不帶時長與刪訊息秒數", () => {
    const body = buildPunishRequest(draft({ kind: "kick", durationSeconds: 3600, deleteMessageSeconds: 86400 }))
    expect(body.duration_seconds).toBeUndefined()
    expect(body.delete_message_seconds).toBeUndefined()
  })
  it("有選公告頻道才帶", () => {
    expect(buildPunishRequest(draft()).announce_channel_id).toBeUndefined()
    expect(buildPunishRequest(draft({ announceChannelId: "700" })).announce_channel_id).toBe("700")
  })
})

describe("punishErrorText", () => {
  it("已知錯誤碼與欄位原因", () => {
    expect(punishErrorText("not_member")).toContain("伺服器內")
    expect(punishErrorText("user_not_found")).toContain("找不到")
    expect(punishErrorText("invalid_request", [{ path: "reason", reason: "必須填寫原因" }])).toBe("必須填寫原因")
    expect(punishErrorText("invalid_request")).toBe("送出失敗，請稍後再試。")
    expect(punishErrorText(null)).toBe("送出失敗，請稍後再試。")
  })
})

describe("punishResultLines", () => {
  const ok = (over: Partial<PunishResponse["result"]> = {}, announce: string | null = null): PunishResponse => ({
    result: { ok: true, error: null, warning_id: 12, already: false, deleted_summary: null, auto_timeout: null, ...over },
    announce_error: announce,
  })
  it("成功顯示紀錄編號", () => {
    expect(punishResultLines("warning", ok())).toEqual({ ok: true, lines: ["已警告，紀錄編號 12。"] })
  })
  it("失敗顯示原因，沒有紀錄", () => {
    const res = punishResultLines("kick", ok({ ok: false, error: "機器人權限不足，或對象的位階高於機器人", warning_id: null }))
    expect(res).toEqual({ ok: false, lines: ["機器人權限不足，或對象的位階高於機器人"] })
  })
  it("已被停權視為成功並說明沒有新紀錄", () => {
    const res = punishResultLines("ban", ok({ already: true, warning_id: null }))
    expect(res.ok).toBe(true)
    expect(res.lines[0]).toContain("已經被停權")
  })
  it("禁言顯示刪除數與略過的頻道", () => {
    const res = punishResultLines("timeout", ok({ deleted_summary: "最近 3600 秒內全伺服器共刪除 3 則（略過 1 個頻道）" }))
    expect(res.lines[1]).toContain("刪除 3 則（略過 1 個頻道）")
  })
  it("公告失敗仍是成功，附上原因", () => {
    const res = punishResultLines("warning", ok({}, "頻道不存在"))
    expect(res.ok).toBe(true)
    expect(res.lines.at(-1)).toBe("紀錄已寫入，但公告失敗：頻道不存在")
  })
  it("自動禁言的結果與失敗原因", () => {
    expect(punishResultLines("warning", ok({ auto_timeout: { ok: true, duration_seconds: 3600, error: null } })).lines[1]).toBe(
      "自動禁言：已禁言 1 小時。",
    )
    expect(punishResultLines("warning", ok({ auto_timeout: { ok: false, duration_seconds: null, error: "權限不足" } })).lines[1]).toBe(
      "自動禁言失敗：權限不足",
    )
  })
  it("動作已執行但紀錄寫入失敗時照實說明", () => {
    const res = punishResultLines("kick", ok({ warning_id: null, error: "動作已執行，但紀錄寫入失敗" }))
    expect(res.lines[0]).toBe("動作已執行，但紀錄寫入失敗。")
  })
})
