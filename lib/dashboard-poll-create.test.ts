import { afterEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  buildPollBody,
  createPoll,
  emptyPollForm,
  fetchPollOptions,
  mapServerFieldErrors,
  parseCreateProblem,
  validatePollForm,
  type PollFormValues,
} from "./dashboard-poll-create"

const valid = (over: Partial<PollFormValues> = {}): PollFormValues => ({
  ...emptyPollForm(),
  channelId: "100",
  title: "午餐吃什麼",
  options: ["拉麵", "咖哩"],
  ...over,
})

describe("validatePollForm", () => {
  it("預設值加上頻道、標題、選項即可送出", () => {
    expect(validatePollForm(valid())).toEqual({})
  })
  it("沒選頻道、沒標題、沒選項", () => {
    const e = validatePollForm({ ...emptyPollForm() })
    expect(Object.keys(e).sort()).toEqual(["channel_id", "options", "title"])
  })
  it("標題 45 字以內，以字元計算", () => {
    expect(validatePollForm(valid({ title: "𠮷".repeat(45) })).title).toBeUndefined()
    expect(validatePollForm(valid({ title: "字".repeat(46) })).title).toMatch(/45/)
  })
  it("選項重複指出後面那一列，忽略前後空白與空白列", () => {
    const e = validatePollForm(valid({ options: ["拉麵", "", " 拉麵 ", "咖哩"] }))
    expect(e).toEqual({ "options.2": "選項重複" })
  })
  it("選項最多 20 項、每項 80 字", () => {
    const many = Array.from({ length: 21 }, (_, i) => `選項${i}`)
    expect(validatePollForm(valid({ options: many })).options).toMatch(/20/)
    expect(validatePollForm(valid({ options: ["字".repeat(81), "b"] }))["options.0"]).toMatch(/80/)
  })
  it("每人可投數不能超過選項數，也要在 1–20", () => {
    expect(validatePollForm(valid({ numberOfUserVotes: "3" })).number_of_user_votes).toMatch(/選項數/)
    expect(validatePollForm(valid({ numberOfUserVotes: "2" })).number_of_user_votes).toBeUndefined()
    expect(validatePollForm(valid({ numberOfUserVotes: "0" })).number_of_user_votes).toBeDefined()
    expect(validatePollForm(valid({ numberOfUserVotes: "" })).number_of_user_votes).toBeDefined()
    expect(validatePollForm(valid({ numberOfUserVotes: "1.5" })).number_of_user_votes).toBeDefined()
  })
  it("權重要在 1–10，沒選身分組的列忽略，身分組不能重複", () => {
    const rows = (...w: [string, string][]) => w.map(([roleId, weight]) => ({ roleId, weight }))
    expect(validatePollForm(valid({ roleWeights: rows(["1", "10"], ["2", "1"]) }))).toEqual({})
    expect(validatePollForm(valid({ roleWeights: rows(["1", "11"]) }))["role_weights.0.weight"]).toBeDefined()
    expect(validatePollForm(valid({ roleWeights: rows(["1", "0"]) }))["role_weights.0.weight"]).toBeDefined()
    expect(validatePollForm(valid({ roleWeights: rows(["", "99"]) }))).toEqual({})
    expect(validatePollForm(valid({ roleWeights: rows(["1", "2"], ["1", "3"]) }))["role_weights.1.role"]).toBeDefined()
  })
})

describe("buildPollBody", () => {
  it("略過空白列並轉成數字，ID 維持字串", () => {
    const body = buildPollBody(
      valid({
        options: [" 拉麵 ", "", "咖哩"],
        showName: true,
        numberOfUserVotes: "2",
        onlyRoles: ["7"],
        roleWeights: [
          { roleId: "", weight: "5" },
          { roleId: "7", weight: "3" },
        ],
      }),
    )
    expect(body).toEqual({
      channel_id: "100",
      title: "午餐吃什麼",
      options: ["拉麵", "咖哩"],
      show_name: true,
      check_results_in_advance: true,
      results_only_initiator: false,
      number_of_user_votes: 2,
      only_roles: ["7"],
      role_weights: [{ role_id: "7", weight: 3 }],
    })
  })
})

describe("mapServerFieldErrors", () => {
  it("把後端的陣列索引換回表單列號，認不得的 path 放進 rest", () => {
    const values = valid({
      options: ["a", "", "b"],
      roleWeights: [
        { roleId: "", weight: "" },
        { roleId: "7", weight: "3" },
      ],
    })
    const { errors, rest } = mapServerFieldErrors(values, [
      { path: "options.1", reason: "重複" },
      { path: "role_weights.0.weight", reason: "權重不對" },
      { path: "channel_id", reason: "不能發言" },
      { path: "only_roles", reason: "身分組已刪除" },
    ])
    expect(errors).toEqual({ "options.2": "重複", "role_weights.1.weight": "權重不對", channel_id: "不能發言" })
    expect(rest).toEqual([{ path: "only_roles", reason: "身分組已刪除" }])
  })
})

describe("parseCreateProblem", () => {
  const err = (code: string | null, body: Record<string, unknown>) => new DashboardApiError(400, code, body, false)
  it("invalid_request 帶 fields", () => {
    const fields = [{ path: "title", reason: "太長" }]
    expect(parseCreateProblem(err("invalid_request", { error: "invalid_request", fields }))).toEqual({ kind: "invalid", fields })
  })
  it("invalid_request 沒有 fields 視為未知", () => {
    expect(parseCreateProblem(err("invalid_request", {}))).toBeNull()
  })
  it("bot_missing_permission 用 fields 的原因，沒有就用預設", () => {
    expect(parseCreateProblem(err("bot_missing_permission", { fields: [{ path: "channel_id", reason: "缺 Send Messages" }] }))).toEqual({
      kind: "message",
      text: "缺 Send Messages",
    })
    expect(parseCreateProblem(err("bot_missing_permission", {}))).toMatchObject({ kind: "message" })
  })
  it("poll_send_failed 優先用中文原因，其次依代碼", () => {
    expect(parseCreateProblem(err("poll_send_failed", { message_failure: "failed", message_failure_text: "Discord 拒絕" }))).toEqual({
      kind: "message",
      text: "Discord 拒絕",
    })
    expect(parseCreateProblem(err("poll_send_failed", { message_failure: "channel_missing" }))).toEqual({
      kind: "message",
      text: "頻道已不存在。",
    })
  })
  it("其他錯誤回 null", () => {
    expect(parseCreateProblem(err("whatever", {}))).toBeNull()
    expect(parseCreateProblem(new Error("x"))).toBeNull()
  })
})

describe("API", () => {
  afterEach(() => vi.unstubAllGlobals())
  const stub = (data: unknown) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => data })
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }
  it("fetchPollOptions 取 /polls/options", async () => {
    const f = stub({ channels: [], roles: [] })
    await fetchPollOptions("123")
    expect(f.mock.calls[0][0]).toBe("/dashboard/guilds/123/polls/options")
  })
  it("createPoll 以 POST 送 JSON", async () => {
    const f = stub({ poll_id: 5, message_url: "u" })
    const body = buildPollBody(valid())
    await expect(createPoll("123", body)).resolves.toEqual({ poll_id: 5, message_url: "u" })
    const [url, init] = f.mock.calls[0]
    expect(url).toBe("/dashboard/guilds/123/polls")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual(body)
  })
})
