import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  aliasesToInput,
  type ChannelCommand,
  commandSummary,
  EMPTY_COMMAND,
  formatConflictField,
  fromConflictValues,
  normalizeName,
  parseAliasInput,
  parseSaveProblem,
  toConflictValues,
  valuesOf,
} from "./dashboard-channel-commands"

const command: ChannelCommand = {
  name: "hi",
  response: "哈囉 {user}",
  aliases: ["h", "yo"],
  enabled: false,
  global_cooldown: 5,
  user_cooldown: 60,
  permission: "mod",
  use_count: 7,
  updated_at: "2026-11-19T04:00:00+00:00",
}

describe("valuesOf", () => {
  it("只留可編輯的欄位，不含使用次數與更新時間", () => {
    const values = valuesOf(command)
    expect(Object.keys(values).sort()).toEqual(Object.keys(EMPTY_COMMAND).sort())
    expect(values.aliases).not.toBe(command.aliases)
  })
})

describe("衝突值的轉換", () => {
  it("字串形式與後端一致：別名排序後換行連接，布林是 true／false", () => {
    expect(toConflictValues({ ...valuesOf(command), aliases: ["yo", "h"] })).toEqual({
      name: "hi",
      response: "哈囉 {user}",
      aliases: "h\nyo",
      enabled: "false",
      global_cooldown: "5",
      user_cooldown: "60",
      permission: "mod",
    })
  })
  it("轉回表單的值", () => {
    const values = valuesOf(command)
    expect(fromConflictValues(toConflictValues(values))).toEqual(values)
    expect(fromConflictValues({ ...toConflictValues(values), aliases: "" }).aliases).toEqual([])
  })
})

describe("formatConflictField", () => {
  it.each([
    ["enabled", "true", "開啟"],
    ["enabled", "false", "關閉"],
    ["global_cooldown", "30", "30 秒"],
    ["permission", "vip", "VIP"],
    ["aliases", "a\nb", "!a、!b"],
    ["name", "hi", "!hi"],
    ["response", "x", "x"],
    ["aliases", "", "無"],
    ["response", null, "無"],
  ])("%s %s → %s", (field, value, expected) => {
    expect(formatConflictField(field, value)).toBe(expected)
  })
})

describe("別名輸入", () => {
  it("空白與逗號分隔，去掉 !、轉小寫、去重、略過空字串", () => {
    expect(parseAliasInput("!Hi, hi  !YO，，x、y")).toEqual(["hi", "yo", "x", "y"])
    expect(parseAliasInput("  ")).toEqual([])
  })
  it("顯示時加上 !", () => {
    expect(aliasesToInput(["a", "b"])).toBe("!a !b")
  })
  it("名稱正規化", () => {
    expect(normalizeName("  !Hello ")).toBe("hello")
  })
})

describe("parseSaveProblem", () => {
  const err = (status: number, code: string, body: Record<string, unknown> = {}) =>
    new DashboardApiError(status, code, { error: code, ...body }, false)

  it("conflict", () => {
    expect(parseSaveProblem(err(409, "conflict", { deleted: false, current: { name: "hi" } }))).toEqual({
      kind: "conflict",
      deleted: false,
      current: { name: "hi" },
    })
    expect(parseSaveProblem(err(409, "conflict", { deleted: true, current: null }))).toEqual({
      kind: "conflict",
      deleted: true,
      current: null,
    })
  })
  it("欄位問題、AutoMod 與未啟用", () => {
    expect(parseSaveProblem(err(400, "invalid_field", { field: "name", reason: "重複" }))).toEqual({
      kind: "invalid_field",
      field: "name",
      reason: "重複",
    })
    expect(parseSaveProblem(err(422, "automod_blocked"))).toEqual({ kind: "automod_blocked" })
    expect(parseSaveProblem(err(503, "automod_unavailable"))).toEqual({ kind: "automod_unavailable" })
    expect(parseSaveProblem(err(409, "channel_not_enabled"))).toEqual({ kind: "not_enabled" })
  })
  it("其他錯誤回 null", () => {
    expect(parseSaveProblem(err(500, "boom"))).toBeNull()
    expect(parseSaveProblem(new Error("x"))).toBeNull()
  })
})

describe("commandSummary", () => {
  it("有個人冷卻與別名時一起顯示", () => {
    expect(commandSummary(valuesOf(command))).toBe("別名 !h !yo · 權限：mod · 全體冷卻 5 秒 · 個人冷卻 60 秒")
  })
  it("沒有別名與個人冷卻時省略", () => {
    expect(commandSummary(EMPTY_COMMAND)).toBe("權限：所有人 · 全體冷卻 30 秒")
  })
})
