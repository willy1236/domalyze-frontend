import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  DEFAULT_BUTTON_LABEL,
  hasLobbyErrors,
  lobbyConflictValues,
  lobbyPreviewButtons,
  newLobbyMessage,
  normalizePrefix,
  parseLobbySaveProblem,
  parseMaxOpen,
  prefixExample,
  prefixProblem,
  splitLobbyFieldErrors,
  validateLobbyForm,
  type LobbyFormValues,
} from "./dashboard-tickets"

describe("normalizePrefix（與後端 normalize_prefix 同一組案例）", () => {
  it.each([
    ["ticket", "ticket"],
    ["Report Case", "report-case"],
    ["  a   b  ", "a-b"],
    ["檢舉 Case_1", "檢舉-case_1"],
    ["a!@#b", "ab"],
    ["--x--y--", "x-y"],
    ["a--b", "a-b"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizePrefix(raw)).toBe(expected)
  })
})

describe("prefixProblem", () => {
  it("1 到 20 個字元合格", () => {
    expect(prefixProblem("report")).toBeNull()
    expect(prefixProblem("a".repeat(20))).toBeNull()
  })

  it.each(["", "   ", "!!!", "a".repeat(21), "a ".repeat(11)])("不合格：%j", (raw) => {
    expect(prefixProblem(raw)).toContain("1 到 20")
  })

  it("以字元計算，不是 UTF-16 單位", () => {
    expect(prefixProblem("😀".repeat(1))).not.toBeNull() // emoji 不是字母數字，處理後為空
    expect(prefixProblem("檢".repeat(20))).toBeNull()
  })
})

describe("prefixExample", () => {
  it("顯示處理後的頻道名稱範例，空前綴不顯示", () => {
    expect(prefixExample("Report Case")).toBe("report-case-0001")
    expect(prefixExample("!!!")).toBe("")
  })
})

describe("parseMaxOpen", () => {
  it("空白是不限", () => {
    expect(parseMaxOpen("")).toBeNull()
    expect(parseMaxOpen("  ")).toBeNull()
  })

  it("1 到 10000 的整數", () => {
    expect(parseMaxOpen("3")).toBe(3)
    expect(parseMaxOpen("10000")).toBe(10000)
  })

  it.each(["0", "-1", "1.5", "abc", "10001"])("不合法：%s", (raw) => {
    expect(parseMaxOpen(raw)).toBeUndefined()
  })
})

const VALID: LobbyFormValues = {
  channelKind: "existing",
  channelId: "5",
  newName: "",
  newCategoryId: null,
  ticketCategoryId: "9",
  namePrefix: "report",
  maxOpen: "",
  buttonLabel: "",
  message: newLobbyMessage(),
  needsChannel: true,
}

describe("validateLobbyForm", () => {
  it("合格的表單沒有錯誤", () => {
    expect(hasLobbyErrors(validateLobbyForm(VALID))).toBe(false)
  })

  it("新增必須選頻道與分類，前綴與上限要合格", () => {
    const e = validateLobbyForm({ ...VALID, channelId: null, ticketCategoryId: null, namePrefix: "!!", maxOpen: "0" })
    expect(Object.keys(e.fields).sort()).toEqual(["lobby_channel", "max_open", "name_prefix", "ticket_category_id"])
  })

  it("新建頻道要有名稱與分類", () => {
    const e = validateLobbyForm({ ...VALID, channelKind: "new", newName: " ", newCategoryId: null })
    expect(Object.keys(e.fields).sort()).toEqual(["lobby_channel.category_id", "lobby_channel.name"])
  })

  it("修改且頻道還在時不檢查頻道", () => {
    expect(validateLobbyForm({ ...VALID, channelId: null, needsChannel: false }).fields).toEqual({})
  })

  it("按鈕文字上限與訊息內容", () => {
    const e = validateLobbyForm({ ...VALID, buttonLabel: "x".repeat(81), message: { content: null, embed: null } })
    expect(e.fields.button_label).toContain("80")
    expect(e.message.map((m) => m.path)).toContain("content")
  })
})

describe("splitLobbyFieldErrors", () => {
  it("訊息欄位與一般欄位分開，管理身分組的錯誤歸在同一欄", () => {
    const e = splitLobbyFieldErrors([
      { path: "embed.description", reason: "太長" },
      { path: "content", reason: "空白" },
      { path: "manager_role_ids.1", reason: "找不到" },
      { path: "manager_role_ids.3", reason: "重複" },
      { path: "name_prefix", reason: "不合格" },
    ])
    expect(e.message.map((m) => m.path)).toEqual(["embed.description", "content"])
    expect(e.fields).toEqual({ manager_role_ids: "找不到；重複", name_prefix: "不合格" })
  })
})

describe("parseLobbySaveProblem", () => {
  const err = (status: number, code: string, body: Record<string, unknown> = {}) =>
    new DashboardApiError(status, code, { error: code, ...body }, false)

  it("衝突：帶最新內容，已刪除則 latest 為 null", () => {
    const latest = { name_prefix: "x" }
    expect(parseLobbySaveProblem(err(409, "conflict", { deleted: false, current: latest }))).toEqual({
      kind: "conflict",
      latest,
    })
    expect(parseLobbySaveProblem(err(409, "conflict", { deleted: true, current: null }))).toEqual({
      kind: "conflict",
      latest: null,
    })
  })

  it("欄位錯誤、Discord 拒絕、存檔失敗、伺服器暫時不可用", () => {
    expect(parseLobbySaveProblem(err(400, "invalid_request", { fields: [{ path: "a", reason: "b" }] }))).toEqual({
      kind: "invalid",
      fields: [{ path: "a", reason: "b" }],
    })
    expect(parseLobbySaveProblem(err(502, "discord_error", { message: "Missing Access" }))).toEqual({
      kind: "discord_error",
      text: "Missing Access",
    })
    expect(parseLobbySaveProblem(err(500, "save_failed"))).toEqual({ kind: "save_failed" })
    expect(parseLobbySaveProblem(err(503, "guild_unavailable"))).toEqual({ kind: "guild_unavailable" })
    expect(parseLobbySaveProblem(err(404, "lobby_not_found"))).toEqual({ kind: "not_found" })
  })

  it("不認得的錯誤與非 API 錯誤回 null", () => {
    expect(parseLobbySaveProblem(err(500, "other"))).toBeNull()
    expect(parseLobbySaveProblem(new Error("x"))).toBeNull()
    expect(parseLobbySaveProblem(err(400, "invalid_request"))).toBeNull()
  })
})

describe("lobbyPreviewButtons", () => {
  it("沒填文字用預設文字，自訂 emoji 顯示名稱", () => {
    expect(lobbyPreviewButtons("  ", null)).toEqual([{ label: DEFAULT_BUTTON_LABEL, emoji: null, style: "primary" }])
    expect(lobbyPreviewButtons("開單", "<:ok:700>")[0]).toMatchObject({ label: "開單", emoji: ":ok:" })
  })
})

describe("lobbyConflictValues", () => {
  it("列出前綴、管理身分組、限制、內容與按鈕文字", () => {
    const v = lobbyConflictValues({
      namePrefix: "report",
      managerRoleNames: ["客服"],
      onePerUser: true,
      maxOpen: 3,
      message: newLobbyMessage(),
      buttonLabel: null,
    })
    expect(v.name_prefix).toBe("report")
    expect(v.manager_roles).toBe("@客服")
    expect(v.limits).toBe("每人一張，同時開啟上限 3 張")
    expect(v.message).toContain("點擊下方按鈕")
    expect(v.button_label).toBe(DEFAULT_BUTTON_LABEL)
    expect(lobbyConflictValues({ ...{ namePrefix: "", onePerUser: false, maxOpen: null, message: { content: null, embed: null }, buttonLabel: "開" }, managerRoleNames: [] }).manager_roles).toBe("（無）")
  })
})
