import type { ReactNode } from "react"
import { renderInline } from "@/components/dashboard/message-preview"
import type { WarningRecord } from "@/lib/dashboard-warnings"

const MENTION = /<@!?(\d+)>/g

type Row = { kind: "heading"; text: string } | { kind: "field"; label: string; value: string } | { kind: "badge"; text: string } | { kind: "text"; text: string }

/** 把警告單 description（Discord markdown）拆成標題、「標籤：內容」欄位、無冒號的標記徽章與其他文字。 */
export function parseSheet(description: string): Row[] {
  const rows: Row[] = []
  for (const raw of description.split("\n")) {
    const line = raw.trim()
    if (!line) continue
    const item = line.match(/^[-*]\s+(.*)$/)
    if (item) {
      const sep = item[1].search(/[：:]/)
      if (sep > 0) rows.push({ kind: "field", label: item[1].slice(0, sep), value: item[1].slice(sep + 1).trim() })
      else rows.push({ kind: "badge", text: item[1] })
    } else if (/^\*\*.*\*\*$/.test(line)) {
      rows.push({ kind: "heading", text: line.slice(2, -2) })
    } else {
      rows.push({ kind: "text", text: line })
    }
  }
  return rows
}

/** 內文：粗體／斜體／連結照 message-preview，`<@id>` 換成「@名稱」樣式（對象、執行者以紀錄已有的名稱對照，查不到就用 ID）。 */
export function renderSheetText(text: string, record: Pick<WarningRecord, "target" | "moderator">): ReactNode[] {
  const names = new Map<string, string>()
  for (const p of [record.target, record.moderator]) {
    names.set(p.id, p.left ? "已離開的成員" : p.name || p.id)
  }
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  for (const m of text.matchAll(MENTION)) {
    const at = m.index ?? 0
    if (at > last) out.push(...renderInline(text.slice(last, at)))
    out.push(
      <span
        key={`m${key++}`}
        className="rounded bg-indigo-600/15 px-1 text-indigo-800 dark:bg-indigo-400/20 dark:text-indigo-200"
      >
        @{names.get(m[1]) ?? m[1]}
      </span>,
    )
    last = at + m[0].length
  }
  if (last < text.length) out.push(...renderInline(text.slice(last)))
  return out
}

/** 近似 Discord embed 的警告單卡片；資訊與 `/warning get` 相同，只是呈現美化。 */
export function WarningSheet({ record, id }: { record: WarningRecord; id: string }) {
  const { title, description } = record.sheet
  const rows = description ? parseSheet(description) : []
  const badges = rows.filter((r) => r.kind === "badge")
  const body = rows.filter((r) => r.kind !== "badge")
  return (
    <div
      id={id}
      className="mt-2 max-w-xl rounded-md border border-l-4 border-primary/20 border-l-primary bg-primary/5 px-3 py-3 text-sm dark:border-champagne/25 dark:border-l-champagne dark:bg-champagne/5"
    >
      {title && (
        <p className="flex items-center gap-2 font-semibold">
          {record.target.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element -- Discord CDN 頭像，與預覽一致不走 next/image
            <img src={record.target.avatar_url} alt="" className="h-6 w-6 shrink-0 rounded-full" />
          )}
          <span className="min-w-0 break-words">{title}</span>
        </p>
      )}
      <div className="mt-2 space-y-1.5">
        {body.map((r, i) => {
          if (r.kind === "heading") {
            return (
              <p key={i} className="font-semibold text-primary dark:text-silver break-words">
                {renderSheetText(r.text, record)}
              </p>
            )
          }
          if (r.kind === "field") {
            return (
              <div key={i} className="grid gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
                <span className="text-gray-600 dark:text-gray-400">{r.label}</span>
                <span className="break-words">{renderSheetText(r.value, record)}</span>
              </div>
            )
          }
          return (
            <p key={i} className="break-words">
              {renderSheetText(r.kind === "text" ? r.text : "", record)}
            </p>
          )
        })}
      </div>
      {badges.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span key={i} className="rounded-sm border border-primary/40 px-2 py-0.5 text-xs text-primary dark:border-champagne/50 dark:text-champagne">
              {b.kind === "badge" ? b.text : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
