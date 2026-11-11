import { describe, expect, it } from "vitest"
import {
  buttonProblems,
  emojiLabel,
  messageInvalidReason,
  scopeLabel,
  type ReactionRoleButton,
  type ReactionRoleMessage,
} from "./dashboard-reaction-roles"

const button = (over: Partial<ReactionRoleButton> = {}): ReactionRoleButton => ({
  role: { id: "1", name: "活動", invalid: false },
  title: "活動",
  emoji: null,
  emoji_invalid: false,
  style: 1,
  ...over,
})

const message = (over: Partial<ReactionRoleMessage> = {}): ReactionRoleMessage => ({
  message_id: "9",
  channel: { id: "5", name: "身分組", invalid: false },
  invalid: false,
  summary: "內容",
  jump_url: "https://discord.com/channels/1/5/9",
  buttons: [],
  permission_issues: [],
  ...over,
})

describe("messageInvalidReason", () => {
  it("正常訊息沒有失效原因", () => {
    expect(messageInvalidReason(message())).toBeNull()
  })
  it("訊息被刪", () => {
    expect(messageInvalidReason(message({ invalid: true }))).toBe("訊息已被刪除")
  })
  it("頻道被刪時只講頻道", () => {
    expect(
      messageInvalidReason(message({ invalid: true, channel: { id: "5", name: null, invalid: true } })),
    ).toBe("頻道已被刪除")
  })
})

describe("buttonProblems", () => {
  it("正常按鈕沒有問題", () => {
    expect(buttonProblems(button())).toEqual([])
  })
  it("身分組已刪除", () => {
    expect(buttonProblems(button({ role: { id: "1", name: null, invalid: true } }))).toEqual(["身分組已被刪除"])
  })
  it("身分組還在但不能發放", () => {
    const [p] = buttonProblems(button({ role: { id: "1", name: "管理", invalid: true } }))
    expect(p).toContain("無法發放")
  })
  it("emoji 失效", () => {
    expect(buttonProblems(button({ emoji_invalid: true }))).toEqual(["自訂 emoji 已不存在"])
  })
  it("兩個問題都列出", () => {
    expect(
      buttonProblems(button({ role: { id: "1", name: null, invalid: true }, emoji_invalid: true })),
    ).toHaveLength(2)
  })
})

describe("emojiLabel", () => {
  it("沒有 emoji 回 null", () => {
    expect(emojiLabel(null)).toBeNull()
    expect(emojiLabel("")).toBeNull()
  })
  it("Unicode 原樣", () => {
    expect(emojiLabel("🎉")).toBe("🎉")
  })
  it("自訂 emoji 顯示名稱，動態的也是", () => {
    expect(emojiLabel("<:party:700000000000001>")).toBe(":party:")
    expect(emojiLabel("<a:party:700000000000001>")).toBe(":party:")
  })
})

describe("scopeLabel", () => {
  it("伺服器與頻道", () => {
    expect(scopeLabel("guild")).toBe("伺服器")
    expect(scopeLabel("channel")).toBe("此頻道")
  })
})
