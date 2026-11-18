import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import { charLength, parseFieldErrors, type FieldError } from "./dashboard-message"

export const TITLE_MAX = 45
export const OPTION_MAX = 80
export const OPTIONS_MAX = 20
export const VOTES_MAX = 20
export const WEIGHT_MIN = 1
export const WEIGHT_MAX = 10
export const DEADLINE_MAX_DAYS = 30

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000
const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

/** datetime-local 的值（YYYY-MM-DDTHH:mm）視為台灣時間，回傳 epoch 毫秒；格式不符回 null。與執行環境的時區無關 */
export function taipeiLocalToEpoch(value: string): number | null {
  const m = LOCAL_DATETIME.exec(value.trim())
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  const utc = new Date(Date.UTC(y, mo - 1, d, h, mi))
  // 擋 2026-02-31 這類被 Date 自動進位的日期
  if (utc.getUTCMonth() !== mo - 1 || utc.getUTCDate() !== d || h > 23 || mi > 59) return null
  return utc.getTime() - TAIPEI_OFFSET_MS
}

/** datetime-local 的值轉成帶 +08:00 的 ISO 字串；格式不符回 null */
export function taipeiLocalToIso(value: string): string | null {
  return LOCAL_DATETIME.test(value.trim()) && taipeiLocalToEpoch(value) !== null ? `${value.trim()}:00+08:00` : null
}

export interface PollChannelOption {
  id: string
  name: string
  type: string
  category: string | null
  /** 星羽或操作者不能在此頻道發言的原因；可以選為 null */
  disabled_reason: string | null
}

export interface PollRoleOption {
  id: string
  name: string
  color: number
}

export interface PollOptions {
  channels: PollChannelOption[]
  roles: PollRoleOption[]
}

export interface PollFormValues {
  channelId: string | null
  title: string
  /** 選項列，含空白列 */
  options: string[]
  showName: boolean
  checkResultsInAdvance: boolean
  resultsOnlyInitiator: boolean
  /** 輸入框的原始字串 */
  numberOfUserVotes: string
  onlyRoles: string[]
  /** 權重列，含尚未選身分組的列；weight 是輸入框的原始字串 */
  roleWeights: { roleId: string; weight: string }[]
  /** datetime-local 的值（台灣時間），空字串代表沒有截止時間 */
  deadline: string
}

export interface PollCreateBody {
  channel_id: string
  title: string
  options: string[]
  show_name: boolean
  check_results_in_advance: boolean
  results_only_initiator: boolean
  number_of_user_votes: number
  only_roles: string[]
  role_weights: { role_id: string; weight: number }[]
  /** 帶 +08:00 的 ISO 字串；沒設時不送 */
  deadline?: string
}

export function emptyPollForm(): PollFormValues {
  return {
    channelId: null,
    title: "",
    options: ["", ""],
    showName: false,
    checkResultsInAdvance: true,
    resultsOnlyInitiator: false,
    numberOfUserVotes: "1",
    onlyRoles: [],
    roleWeights: [],
    deadline: "",
  }
}

/** 欄位錯誤，key 是欄位 path：channel_id、title、options、options.N、number_of_user_votes、deadline、role_weights.N.weight（N 是表單的列號） */
export type PollFieldErrors = Record<string, string>

const filledOptions = (values: PollFormValues) =>
  values.options.map((text, row) => ({ text: text.trim(), row })).filter((o) => o.text !== "")

const filledWeights = (values: PollFormValues) =>
  values.roleWeights.map((w, row) => ({ ...w, row })).filter((w) => w.roleId !== "")

function parseInt10(raw: string): number | null {
  const t = raw.trim()
  return /^\d+$/.test(t) ? Number(t) : null
}

/** 前端先擋的規則，與後端 validate_poll_input 一致；回傳空物件表示可以送出 */
export function validatePollForm(values: PollFormValues, now: number = Date.now()): PollFieldErrors {
  const errors: PollFieldErrors = {}
  if (!values.channelId) errors.channel_id = "請選擇頻道"

  const title = values.title.trim()
  if (!title) errors.title = "請填寫標題"
  else if (charLength(title) > TITLE_MAX) errors.title = `標題不能超過 ${TITLE_MAX} 字`

  const options = filledOptions(values)
  if (options.length === 0) errors.options = "至少要有 1 個選項"
  else if (options.length > OPTIONS_MAX) errors.options = `選項不能超過 ${OPTIONS_MAX} 項`
  const seen = new Map<string, number>()
  for (const o of options) {
    if (charLength(o.text) > OPTION_MAX) errors[`options.${o.row}`] = `選項不能超過 ${OPTION_MAX} 字`
    else if (seen.has(o.text)) errors[`options.${o.row}`] = "選項重複"
    seen.set(o.text, o.row)
  }

  const votes = parseInt10(values.numberOfUserVotes)
  if (votes === null || votes < 1 || votes > VOTES_MAX) {
    errors.number_of_user_votes = `每人可投票數要在 1 到 ${VOTES_MAX} 之間`
  } else if (options.length > 0 && votes > options.length) {
    errors.number_of_user_votes = `每人可投票數不能超過選項數（${options.length}）`
  }

  const used = new Set<string>()
  for (const w of filledWeights(values)) {
    const n = parseInt10(w.weight)
    if (n === null || n < WEIGHT_MIN || n > WEIGHT_MAX) errors[`role_weights.${w.row}.weight`] = `權重要在 ${WEIGHT_MIN} 到 ${WEIGHT_MAX} 之間`
    else if (used.has(w.roleId)) errors[`role_weights.${w.row}.role`] = "身分組重複"
    used.add(w.roleId)
  }

  if (values.deadline.trim() !== "") {
    const at = taipeiLocalToEpoch(values.deadline)
    if (at === null) errors.deadline = "截止時間格式不正確"
    else if (at <= now) errors.deadline = "截止時間必須晚於現在"
    else if (at > now + DEADLINE_MAX_DAYS * 24 * 60 * 60 * 1000) errors.deadline = `截止時間最長為 ${DEADLINE_MAX_DAYS} 天後`
  }
  return errors
}

/** 表單轉成 API body（略過空白的選項列與沒選身分組的權重列）；需先通過 validatePollForm */
export function buildPollBody(values: PollFormValues): PollCreateBody {
  const deadline = values.deadline.trim() === "" ? null : taipeiLocalToIso(values.deadline)
  return {
    channel_id: values.channelId ?? "",
    title: values.title.trim(),
    options: filledOptions(values).map((o) => o.text),
    show_name: values.showName,
    check_results_in_advance: values.checkResultsInAdvance,
    results_only_initiator: values.resultsOnlyInitiator,
    number_of_user_votes: Number(values.numberOfUserVotes.trim()),
    only_roles: values.onlyRoles,
    role_weights: filledWeights(values).map((w) => ({ role_id: w.roleId, weight: Number(w.weight.trim()) })),
    ...(deadline ? { deadline } : {}),
  }
}

/**
 * 後端 fields 轉成表單的欄位錯誤。後端的 options.N、role_weights.N 是 buildPollBody 送出的陣列索引，
 * 這裡換回表單的列號；認不得的 path 放進 `rest`，由呼叫端顯示在表單層級。
 */
export function mapServerFieldErrors(
  values: PollFormValues,
  fields: FieldError[],
): { errors: PollFieldErrors; rest: FieldError[] } {
  const optionRows = filledOptions(values).map((o) => o.row)
  const weightRows = filledWeights(values).map((w) => w.row)
  const errors: PollFieldErrors = {}
  const rest: FieldError[] = []
  for (const f of fields) {
    const option = /^options\.(\d+)$/.exec(f.path)
    const weight = /^role_weights\.(\d+)(?:\.(role_id|role|weight))?$/.exec(f.path)
    if (["channel_id", "title", "options", "number_of_user_votes", "deadline"].includes(f.path)) {
      errors[f.path] ??= f.reason
    } else if (option && optionRows[Number(option[1])] !== undefined) {
      errors[`options.${optionRows[Number(option[1])]}`] ??= f.reason
    } else if (weight && weightRows[Number(weight[1])] !== undefined) {
      const part = weight[2] === "role_id" || weight[2] === "role" ? "role" : "weight"
      errors[`role_weights.${weightRows[Number(weight[1])]}.${part}`] ??= f.reason
    } else rest.push(f)
  }
  return { errors, rest }
}

export type CreateProblem =
  | { kind: "invalid"; fields: FieldError[] }
  | { kind: "message"; text: string }

const SEND_FAILED_TEXT: Record<string, string> = {
  channel_missing: "頻道已不存在。",
  no_permission: "星羽沒有在這個頻道發言的權限。",
  failed: "投票訊息發送失敗。",
}

/** 把發起的 API 錯誤分類；不是已知的錯誤回 null */
export function parseCreateProblem(e: unknown): CreateProblem | null {
  if (!(e instanceof DashboardApiError)) return null
  const body = e.body ?? {}
  switch (e.code) {
    case "invalid_request": {
      const fields = parseFieldErrors(e)
      return fields ? { kind: "invalid", fields } : null
    }
    case "bot_missing_permission": {
      const fields = Array.isArray(body.fields) ? (body.fields as { reason?: unknown }[]) : []
      const reason = fields.find((f) => typeof f?.reason === "string")?.reason
      return { kind: "message", text: typeof reason === "string" ? reason : "星羽沒有在這個頻道發言的權限。" }
    }
    case "poll_send_failed": {
      const text = typeof body.message_failure_text === "string" ? body.message_failure_text : null
      const failure = typeof body.message_failure === "string" ? body.message_failure : "failed"
      return { kind: "message", text: text ?? SEND_FAILED_TEXT[failure] ?? SEND_FAILED_TEXT.failed }
    }
    default:
      return null
  }
}

const base = (guildId: string) => `/dashboard/guilds/${encodeURIComponent(guildId)}/polls`

export function fetchPollOptions(guildId: string, signal?: AbortSignal): Promise<PollOptions> {
  return dashboardFetch<PollOptions>(`${base(guildId)}/options`, {}, { signal })
}

export function createPoll(guildId: string, body: PollCreateBody): Promise<{ poll_id: number; message_url: string }> {
  return dashboardFetch(base(guildId), { method: "POST", json: body })
}
