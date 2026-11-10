import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  AUTHOR_NAME_MAX,
  CONTENT_MAX,
  DESCRIPTION_MAX,
  EMBED_TOTAL_MAX,
  FIELDS_MAX,
  FIELD_NAME_MAX,
  FIELD_VALUE_MAX,
  FOOTER_TEXT_MAX,
  TITLE_MAX,
  chunkButtons,
  emptyEmbed,
  hasTimestamp,
  moveItem,
  originalTimestamp,
  parseFieldErrors,
  readBackReasonText,
  setTimestamp,
  validateMessage,
  type EmbedContent,
  type MessageContent,
} from "./dashboard-message"

const paths = (c: MessageContent) => validateMessage(c).map((e) => e.path)
const withEmbed = (patch: Partial<EmbedContent>): MessageContent => ({
  content: null,
  embed: { ...emptyEmbed(), ...patch },
})
const x = (n: number) => "x".repeat(n)

describe("validateMessage", () => {
  it("文字與 embed 都空白時不能存", () => {
    expect(paths({ content: null, embed: null })).toEqual(["content"])
    expect(paths({ content: "   ", embed: null })).toEqual(["content"])
    expect(paths({ content: "hi", embed: null })).toEqual([])
    expect(paths(withEmbed({ title: "t" }))).toEqual([])
  })

  it("只有 color 或 timestamp 算空", () => {
    expect(paths(withEmbed({ color: 5, extra: { timestamp: "now" } }))).toEqual(["content"])
    expect(paths({ content: "hi", embed: { ...emptyEmbed(), color: 5 } })).toEqual([])
  })

  const cases: [string, (s: string) => MessageContent, string, number][] = [
    ["content", (s) => ({ content: s, embed: null }), "content", CONTENT_MAX],
    ["title", (s) => withEmbed({ title: s }), "embed.title", TITLE_MAX],
    ["description", (s) => withEmbed({ description: s }), "embed.description", DESCRIPTION_MAX],
    ["author", (s) => withEmbed({ author: { name: s, url: null, icon_url: null } }), "embed.author.name", AUTHOR_NAME_MAX],
    ["footer", (s) => withEmbed({ footer: { text: s, icon_url: null } }), "embed.footer.text", FOOTER_TEXT_MAX],
    ["field name", (s) => withEmbed({ fields: [{ name: s, value: "v", inline: false }] }), "embed.fields.0.name", FIELD_NAME_MAX],
    ["field value", (s) => withEmbed({ fields: [{ name: "n", value: s, inline: false }] }), "embed.fields.0.value", FIELD_VALUE_MAX],
  ]
  it.each(cases)("%s 上限", (_label, make, path, limit) => {
    expect(paths(make(x(limit)))).not.toContain(path)
    expect(paths(make(x(limit + 1)))).toContain(path)
  })

  it("以字元計算長度，與後端一致", () => {
    expect(paths({ content: "😀".repeat(CONTENT_MAX), embed: null })).toEqual([])
  })

  it("field 數量與空白 field", () => {
    const ok = Array.from({ length: FIELDS_MAX }, () => ({ name: "n", value: "v", inline: false }))
    expect(paths(withEmbed({ fields: ok }))).toEqual([])
    expect(paths(withEmbed({ fields: [...ok, ok[0]] }))).toEqual(["embed.fields"])
    expect(paths(withEmbed({ fields: [{ name: "", value: " ", inline: false }] }))).toEqual([
      "embed.fields.0.name",
      "embed.fields.0.value",
    ])
  })

  it("embed 總長 6000", () => {
    const base = { title: x(256), description: x(4096) }
    expect(paths(withEmbed({ ...base, footer: { text: x(1700), icon_url: null } }))).toEqual(["embed"])
    const edge = EMBED_TOTAL_MAX - 256 - 4096
    expect(paths(withEmbed({ ...base, footer: { text: x(edge), icon_url: null } }))).toEqual([])
  })

  it("URL、顏色與 extra", () => {
    const c = withEmbed({
      title: "t",
      url: "javascript:alert(1)",
      image_url: "ftp://x/y.png",
      thumbnail_url: "https://ok/y.png",
      color: 0x1000000,
      extra: { timestamp: "bad", other: 1 },
    })
    expect(paths(c).sort()).toEqual(
      ["embed.url", "embed.image_url", "embed.color", "embed.extra.timestamp", "embed.extra.other"].sort(),
    )
    expect(paths(withEmbed({ title: "t", color: 0xffffff, extra: { timestamp: "2026-01-01T00:00:00+00:00" } }))).toEqual([])
  })
})

describe("時間戳", () => {
  it("勾選：沒有原值帶 now，有原值保留；取消移除", () => {
    const e = emptyEmbed()
    expect(setTimestamp(e, true, null).extra).toEqual({ timestamp: "now" })
    expect(setTimestamp(e, true, "2026-01-01T00:00:00+00:00").extra).toEqual({ timestamp: "2026-01-01T00:00:00+00:00" })
    const on = setTimestamp(e, true, null)
    expect(hasTimestamp(on)).toBe(true)
    expect(hasTimestamp(setTimestamp(on, false, null))).toBe(false)
  })

  it("originalTimestamp 不把 now 當原值", () => {
    expect(originalTimestamp({ ...emptyEmbed(), extra: { timestamp: "now" } })).toBeNull()
    expect(originalTimestamp({ ...emptyEmbed(), extra: { timestamp: "2026-01-01T00:00:00+00:00" } })).toBe(
      "2026-01-01T00:00:00+00:00",
    )
    expect(originalTimestamp(null)).toBeNull()
  })
})

describe("其他", () => {
  it("chunkButtons 每 5 顆換列", () => {
    expect(chunkButtons([])).toEqual([])
    expect(chunkButtons([1, 2, 3, 4, 5]).map((r) => r.length)).toEqual([5])
    expect(chunkButtons([1, 2, 3, 4, 5, 6]).map((r) => r.length)).toEqual([5, 1])
    expect(chunkButtons(Array.from({ length: 25 }, (_, i) => i)).length).toBe(5)
  })

  it("moveItem", () => {
    expect(moveItem([1, 2, 3], 1, -1)).toEqual([2, 1, 3])
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 3, 2])
    const a = [1, 2]
    expect(moveItem(a, 0, -1)).toBe(a)
    expect(moveItem(a, 1, 1)).toBe(a)
  })

  it("parseFieldErrors 讀 invalid_request 的 fields", () => {
    const fields = [{ path: "embed.fields.2.value", reason: "太長" }]
    expect(parseFieldErrors(new DashboardApiError(400, "invalid_request", { error: "invalid_request", fields }, false))).toEqual(fields)
    expect(parseFieldErrors(new DashboardApiError(400, "invalid_request", { error: "invalid_request" }, false))).toBeNull()
    expect(parseFieldErrors(new DashboardApiError(400, "conflict", { fields }, false))).toBeNull()
    expect(parseFieldErrors(new Error("x"))).toBeNull()
  })

  it("readBackReasonText 代碼對照", () => {
    expect(readBackReasonText("multiple_embeds")).toContain("embed")
    expect(readBackReasonText("has_attachments")).toContain("附件")
    expect(readBackReasonText("unknown")).toContain("無法處理")
  })
})
