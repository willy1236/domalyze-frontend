import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  MAX_BUTTONS,
  blankButton,
  buttonProblems,
  conflictValues,
  dangerNotice,
  emojiLabel,
  formButtonsFromDetail,
  formErrors,
  hasFormErrors,
  messageInvalidReason,
  originalOf,
  parseSaveProblem,
  previewButtons,
  roleOptionState,
  scopeLabel,
  splitFieldErrors,
  toRequestButtons,
  validateButtons,
  type DetailButton,
  type FormButton,
  type ReactionRoleButton,
  type ReactionRoleDetail,
  type ReactionRoleMessage,
  type RoleOption,
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

// ====== R-02 ======
const fb = (over: Partial<FormButton> = {}): FormButton => ({
  key: "k",
  role_id: "1",
  title: "活動",
  emoji: null,
  style: 1,
  locked: false,
  ...over,
})

const role = (over: Partial<RoleOption> = {}): RoleOption => ({
  id: "1",
  name: "活動",
  color: 0,
  disabled_reason: null,
  dangerous: false,
  dangerous_permissions: [],
  ...over,
})

describe("validateButtons", () => {
  it("至少一顆按鈕", () => {
    expect(validateButtons([])._).toBe("至少要有一顆按鈕")
  })

  it("最多 25 顆", () => {
    const many = Array.from({ length: MAX_BUTTONS + 1 }, (_, i) => fb({ key: `k${i}`, role_id: String(i) }))
    expect(validateButtons(many)._).toContain("25")
    expect(validateButtons(many.slice(0, MAX_BUTTONS))._).toBeUndefined()
  })

  it("沒選身分組、標題空白或太長", () => {
    const errs = validateButtons([
      fb({ key: "a", role_id: null }),
      fb({ key: "b", role_id: "2", title: "  " }),
      fb({ key: "c", role_id: "3", title: "字".repeat(81) }),
      fb({ key: "d", role_id: "4", title: "字".repeat(80) }),
    ])
    expect(errs.a).toBe("請選擇身分組")
    expect(errs.b).toBe("標題不能空白")
    expect(errs.c).toContain("80")
    expect(errs.d).toBeUndefined()
  })

  it("同一身分組不能出現兩次，被標出的是後面那顆", () => {
    const errs = validateButtons([fb({ key: "a", role_id: "1" }), fb({ key: "b", role_id: "1", title: "另一個" })])
    expect(errs.a).toBeUndefined()
    expect(errs.b).toBe("同一個身分組只能出現一次")
  })

  it("鎖定的按鈕不檢查標題，但仍佔用身分組", () => {
    const errs = validateButtons([fb({ key: "a", role_id: "9", title: "", locked: true }), fb({ key: "b", role_id: "9" })])
    expect(errs.a).toBeUndefined()
    expect(errs.b).toBe("同一個身分組只能出現一次")
  })

  it("formErrors 在內容鎖定時不驗證訊息；有任何錯誤 hasFormErrors 為 true", () => {
    expect(formErrors(null, [fb()])).toEqual({ message: [], buttons: {} })
    expect(hasFormErrors(formErrors(null, [fb()]))).toBe(false)
    const withEmptyMessage = formErrors({ content: null, embed: null }, [fb()])
    expect(withEmptyMessage.message[0].path).toBe("content")
    expect(hasFormErrors(withEmptyMessage)).toBe(true)
    expect(hasFormErrors(formErrors(null, []))).toBe(true)
  })
})

describe("roleOptionState", () => {
  const a = fb({ key: "a", role_id: "1" })
  const b = fb({ key: "b", role_id: null })

  it("有停用原因就停用並附原因", () => {
    expect(roleOptionState(role({ id: "2", disabled_reason: "位階太高" }), b, [a, b])).toEqual({
      disabled: true,
      reason: "位階太高",
    })
  })

  it("已被其他按鈕選走就停用，自己目前選的永遠可選", () => {
    expect(roleOptionState(role({ id: "1" }), b, [a, b])).toEqual({ disabled: true, reason: "已用於這則訊息的其他按鈕" })
    expect(roleOptionState(role({ id: "1" }), a, [a, b])).toEqual({ disabled: false, reason: null })
  })

  it("既有按鈕目前的身分組即使有停用原因（位階過高）仍保持可見可選", () => {
    expect(roleOptionState(role({ id: "1", disabled_reason: "位階太高" }), a, [a])).toEqual({ disabled: false, reason: null })
  })

  it("沒有問題就可選", () => {
    expect(roleOptionState(role({ id: "3" }), b, [a, b])).toEqual({ disabled: false, reason: null })
  })
})

describe("dangerNotice", () => {
  it("沒有危險權限或找不到身分組回 null", () => {
    expect(dangerNotice(role())).toBeNull()
    expect(dangerNotice(undefined)).toBeNull()
  })

  it("列出權限名稱，並說明仍可儲存", () => {
    const text = dangerNotice(role({ dangerous: true, dangerous_permissions: ["administrator", "ban_members", "unknown_perm"] }))
    expect(text).toContain("任何人按下按鈕都會取得這些權限")
    expect(text).toContain("Administrator、Ban Members、unknown_perm")
    expect(text).toContain("仍可儲存")
  })
})

describe("按鈕的轉換", () => {
  const detailButton = (over: Partial<DetailButton> = {}): DetailButton => ({
    role_id: "1",
    role: { id: "1", name: "活動", invalid: false },
    title: "活動",
    emoji: "🎉",
    emoji_invalid: false,
    style: null,
    locked: false,
    locked_reason: null,
    ...over,
  })
  const detail: ReactionRoleDetail = {
    message_id: "9",
    channel: { id: "5", name: "x", invalid: false },
    content: { content: "x", embed: null },
    content_json: "json",
    content_locked: null,
    buttons: [detailButton(), detailButton({ role_id: "2", title: "高", locked: true, style: 3, emoji: null })],
  }

  it("originalOf 保留後端給的原值（style 可為 null）", () => {
    expect(originalOf(detail)).toEqual({
      content_json: "json",
      buttons: [
        { role_id: "1", title: "活動", emoji: "🎉", style: null },
        { role_id: "2", title: "高", emoji: null, style: 3 },
      ],
    })
  })

  it("formButtonsFromDetail：style 預設主要、帶入 locked、每顆有不同的 key", () => {
    const [a, b] = formButtonsFromDetail(detail.buttons)
    expect(a.style).toBe(1)
    expect(b).toMatchObject({ role_id: "2", style: 3, locked: true })
    expect(a.key).not.toBe(b.key)
  })

  it("toRequestButtons：標題去頭尾空白，未選身分組送空字串", () => {
    expect(toRequestButtons([fb({ title: " 活動 " }), blankButton()])).toEqual([
      { role_id: "1", title: "活動", emoji: null, style: 1 },
      { role_id: "", title: "", emoji: null, style: 1 },
    ])
  })

  it("previewButtons：樣式對應、空標題給占位文字、自訂 emoji 顯示名稱", () => {
    expect(previewButtons([fb({ style: 4, emoji: "<:ok:7>" }), fb({ title: "", style: 2 })])).toEqual([
      { label: "活動", emoji: ":ok:", style: "danger" },
      { label: "（未命名）", emoji: null, style: "secondary" },
    ])
  })
})

describe("parseSaveProblem", () => {
  const err = (status: number, body: Record<string, unknown>) => new DashboardApiError(status, String(body.error), body, false)

  it("409 conflict：最新版本，已刪除時 latest 為 null", () => {
    const latest = { message_id: "9" }
    expect(parseSaveProblem(err(409, { error: "conflict", deleted: false, current: latest }))).toEqual({ kind: "conflict", latest })
    expect(parseSaveProblem(err(409, { error: "conflict", deleted: true, current: null }))).toEqual({ kind: "conflict", latest: null })
  })

  it("400 invalid_request 與 locked_button 帶欄位", () => {
    const fields = [{ path: "buttons.0.role_id", reason: "不行" }]
    expect(parseSaveProblem(err(400, { error: "invalid_request", fields }))).toEqual({ kind: "invalid", fields })
    expect(parseSaveProblem(err(400, { error: "locked_button", fields }))).toEqual({ kind: "locked_button", fields })
    expect(parseSaveProblem(err(400, { error: "invalid_request" }))).toBeNull()
  })

  it("content_locked、bot_missing_permission、discord_error、save_failed、message_not_found", () => {
    expect(parseSaveProblem(err(400, { error: "content_locked", reason: "multiple_embeds" }))).toMatchObject({
      kind: "content_locked",
      text: expect.stringContaining("兩個以上的 embed"),
    })
    expect(
      parseSaveProblem(err(400, { error: "bot_missing_permission", fields: [{ path: "channel_id", reason: "缺少 Send Messages" }] })),
    ).toEqual({ kind: "bot_missing_permission", text: "缺少 Send Messages" })
    expect(parseSaveProblem(err(502, { error: "discord_error", message: "boom" }))).toEqual({ kind: "discord_error", text: "boom" })
    expect(parseSaveProblem(err(500, { error: "save_failed" }))).toEqual({ kind: "save_failed" })
    expect(parseSaveProblem(err(404, { error: "message_not_found" }))).toEqual({ kind: "message_not_found" })
  })

  it("未知錯誤與非 API 錯誤回 null", () => {
    expect(parseSaveProblem(err(500, { error: "weird" }))).toBeNull()
    expect(parseSaveProblem(new Error("x"))).toBeNull()
  })
})

describe("splitFieldErrors", () => {
  it("buttons.N.* 對應到第 N 顆按鈕的 key，其他留在訊息欄位", () => {
    const buttons = [fb({ key: "a" }), fb({ key: "b" })]
    expect(
      splitFieldErrors(
        [
          { path: "buttons.1.role_id", reason: "不行" },
          { path: "buttons", reason: "至少要有一顆按鈕" },
          { path: "content", reason: "太長" },
          { path: "buttons.9.title", reason: "不存在的按鈕" },
        ],
        buttons,
      ),
    ).toEqual({ message: [{ path: "content", reason: "太長" }], buttons: { b: "不行", _: "至少要有一顆按鈕" } })
  })
})

describe("conflictValues", () => {
  it("彙整文字與按鈕；內容鎖定顯示不可編輯", () => {
    const v = conflictValues({ content: "你好", embed: null }, [
      { title: "活動", emoji: "🎉", roleName: "活動組" },
      { title: "壞", emoji: null, roleName: null },
    ])
    expect(v.content).toBe("你好")
    expect(v.buttons).toBe("🎉 活動 → @活動組\n壞 → （未選）")
    expect(conflictValues(null, []).content).toBe("（不可編輯）")
    expect(conflictValues({ content: null, embed: null }, []).content).toBe("（空白）")
  })
})
