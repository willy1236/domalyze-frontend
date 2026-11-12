// 訊息編輯器的資料型別與驗證。型別與上限常數對應後端 starlib/message_content.py，path 規則也與後端一致。

import { DashboardApiError } from "@/lib/dashboard-api"

export const CONTENT_MAX = 2000
export const TITLE_MAX = 256
export const DESCRIPTION_MAX = 4096
export const FIELDS_MAX = 25
export const FIELD_NAME_MAX = 256
export const FIELD_VALUE_MAX = 1024
export const FOOTER_TEXT_MAX = 2048
export const AUTHOR_NAME_MAX = 256
export const EMBED_TOTAL_MAX = 6000
export const COLOR_MAX = 0xffffff

/** extra.timestamp 的特殊值：送出時帶當下時間 */
export const TIMESTAMP_NOW = "now"

/** 預覽的按鈕列每列最多幾顆 */
export const BUTTONS_PER_ROW = 5

export interface EmbedAuthor {
  name: string | null
  url: string | null
  icon_url: string | null
}

export interface EmbedFooter {
  text: string | null
  icon_url: string | null
}

export interface EmbedField {
  name: string
  value: string
  inline: boolean
}

export interface EmbedContent {
  title: string | null
  url: string | null
  description: string | null
  color: number | null
  author: EmbedAuthor | null
  fields: EmbedField[]
  image_url: string | null
  thumbnail_url: string | null
  footer: EmbedFooter | null
  /** 編輯器不直接編輯的欄位；目前只有 timestamp（ISO 字串，或 TIMESTAMP_NOW） */
  extra: { timestamp?: string } & Record<string, unknown>
}

export interface MessageContent {
  content: string | null
  embed: EmbedContent | null
}

export interface FieldError {
  path: string
  reason: string
}

/** 預覽用的按鈕（由 R-02、P-02 提供），只描述外觀 */
export interface PreviewButton {
  label: string
  emoji?: string | null
  style?: "primary" | "secondary" | "success" | "danger" | "link"
  disabled?: boolean
}

export function emptyEmbed(): EmbedContent {
  return {
    title: null,
    url: null,
    description: null,
    color: null,
    author: null,
    fields: [],
    image_url: null,
    thumbnail_url: null,
    footer: null,
    extra: {},
  }
}

export function emptyMessage(): MessageContent {
  return { content: null, embed: null }
}

/** 與後端一致：以字元（code point）計算長度 */
export function charLength(value: string | null | undefined): number {
  return value ? [...value].length : 0
}
const len = charLength

/** 沒有任何文字或圖片類欄位就是空的；只有 color 或 timestamp 也算空 */
export function embedIsEmpty(e: EmbedContent | null): boolean {
  if (!e) return true
  return !(
    e.title ||
    e.description ||
    e.author?.name ||
    e.fields.length > 0 ||
    e.footer?.text ||
    e.image_url ||
    e.thumbnail_url
  )
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return (u.protocol === "http:" || u.protocol === "https:") && u.host !== ""
  } catch {
    return false
  }
}

function timestampOk(value: unknown): boolean {
  if (value === TIMESTAMP_NOW) return true
  return typeof value === "string" && value !== "" && !Number.isNaN(Date.parse(value))
}

export function validateMessage(c: MessageContent): FieldError[] {
  const errors: FieldError[] = []
  const checkLen = (path: string, value: string | null | undefined, limit: number, label: string) => {
    if (len(value) > limit) errors.push({ path, reason: `${label}不能超過 ${limit} 字` })
  }
  const checkUrl = (path: string, value: string | null | undefined, label: string) => {
    if (value && !isHttpUrl(value)) errors.push({ path, reason: `${label}必須是 http 或 https 網址` })
  }

  checkLen("content", c.content, CONTENT_MAX, "文字")
  const e = c.embed
  if (embedIsEmpty(e) && !(c.content && c.content.trim())) {
    errors.push({ path: "content", reason: "文字與 embed 至少要填一項" })
  }
  if (!e) return errors

  checkLen("embed.title", e.title, TITLE_MAX, "標題")
  checkUrl("embed.url", e.url, "標題連結")
  checkLen("embed.description", e.description, DESCRIPTION_MAX, "說明")
  if (e.color !== null && !(Number.isInteger(e.color) && e.color >= 0 && e.color <= COLOR_MAX)) {
    errors.push({ path: "embed.color", reason: "顏色必須在 0 到 16777215 之間" })
  }
  if (e.author) {
    checkLen("embed.author.name", e.author.name, AUTHOR_NAME_MAX, "作者名稱")
    checkUrl("embed.author.url", e.author.url, "作者連結")
    checkUrl("embed.author.icon_url", e.author.icon_url, "作者圖示")
  }
  if (e.fields.length > FIELDS_MAX) errors.push({ path: "embed.fields", reason: `field 不能超過 ${FIELDS_MAX} 個` })
  e.fields.forEach((f, i) => {
    if (!f.name.trim()) errors.push({ path: `embed.fields.${i}.name`, reason: "field 名稱不能空白" })
    checkLen(`embed.fields.${i}.name`, f.name, FIELD_NAME_MAX, "field 名稱")
    if (!f.value.trim()) errors.push({ path: `embed.fields.${i}.value`, reason: "field 內容不能空白" })
    checkLen(`embed.fields.${i}.value`, f.value, FIELD_VALUE_MAX, "field 內容")
  })
  checkUrl("embed.image_url", e.image_url, "圖片")
  checkUrl("embed.thumbnail_url", e.thumbnail_url, "縮圖")
  if (e.footer) {
    checkLen("embed.footer.text", e.footer.text, FOOTER_TEXT_MAX, "頁尾文字")
    checkUrl("embed.footer.icon_url", e.footer.icon_url, "頁尾圖示")
  }
  for (const [key, value] of Object.entries(e.extra)) {
    if (key !== "timestamp") errors.push({ path: `embed.extra.${key}`, reason: "不支援的欄位" })
    else if (!timestampOk(value)) errors.push({ path: "embed.extra.timestamp", reason: "時間戳格式不正確" })
  }

  const total =
    len(e.title) +
    len(e.description) +
    len(e.author?.name) +
    len(e.footer?.text) +
    e.fields.reduce((sum, f) => sum + len(f.name) + len(f.value), 0)
  if (total > EMBED_TOTAL_MAX) {
    errors.push({
      path: "embed",
      reason: `embed 的標題、說明、field、作者與頁尾加總不能超過 ${EMBED_TOTAL_MAX} 字（目前 ${total}）`,
    })
  }
  return errors
}

/** 後端 400 invalid_request 的 fields 陣列；不是這種回應就回 null */
export function parseFieldErrors(e: unknown): FieldError[] | null {
  if (!(e instanceof DashboardApiError) || e.code !== "invalid_request") return null
  const fields = (e.body as { fields?: unknown } | null)?.fields
  if (!Array.isArray(fields)) return null
  const result = fields.filter(
    (f): f is FieldError => !!f && typeof f.path === "string" && typeof f.reason === "string",
  )
  return result.length > 0 ? result : null
}

/** 讀回既有訊息失敗的原因代碼（後端 from_message）→ 正體中文說明 */
const READ_BACK_REASONS: Record<string, string> = {
  multiple_embeds: "這則訊息有兩個以上的 embed，編輯器無法處理。",
  has_attachments: "這則訊息帶有附件，編輯器無法處理。",
  message_unavailable: "讀不到這則訊息的內容（訊息或頻道可能已被刪除，或 bot 沒有讀取權限）。",
}

export function readBackReasonText(code: string): string {
  return READ_BACK_REASONS[code] ?? "這則訊息的格式編輯器無法處理。"
}

/** 勾選「顯示時間戳」：保留原值（有的話），否則送出時帶當下時間；取消則移除 */
export function setTimestamp(embed: EmbedContent, on: boolean, original: string | null): EmbedContent {
  const { timestamp: _removed, ...rest } = embed.extra
  void _removed
  return { ...embed, extra: on ? { ...rest, timestamp: original ?? TIMESTAMP_NOW } : rest }
}

export function hasTimestamp(embed: EmbedContent | null): boolean {
  return !!embed?.extra.timestamp
}

/** 目前訊息中已存在的原始時間戳（不含 now），給 setTimestamp 當 original */
export function originalTimestamp(embed: EmbedContent | null): string | null {
  const ts = embed?.extra.timestamp
  return typeof ts === "string" && ts !== TIMESTAMP_NOW ? ts : null
}

/** 把陣列移動一格（編輯器的 field 排序用）；超出範圍回傳原陣列 */
export function moveItem<T>(items: T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta
  if (to < 0 || to >= items.length) return items
  const next = items.slice()
  ;[next[index], next[to]] = [next[to], next[index]]
  return next
}

/** 按鈕每 BUTTONS_PER_ROW 顆換一列 */
export function chunkButtons<T>(buttons: T[]): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < buttons.length; i += BUTTONS_PER_ROW) rows.push(buttons.slice(i, i + BUTTONS_PER_ROW))
  return rows
}
