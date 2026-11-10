import type { ReactNode } from "react"
import { BUTTONS_PER_ROW, chunkButtons, embedIsEmpty, type MessageContent, type PreviewButton } from "@/lib/dashboard-message"

// 預覽只求近似 Discord：inline 只處理粗體、斜體與連結，其餘 markdown 原樣顯示。
const INLINE = /\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g

/** 把文字中的粗體、斜體與連結轉成元素；其餘維持原樣 */
export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0
    if (at > last) nodes.push(text.slice(last, at))
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>)
    else if (m[2] !== undefined || m[3] !== undefined) nodes.push(<em key={key++}>{m[2] ?? m[3]}</em>)
    else {
      nodes.push(
        <a key={key++} href={m[5]} target="_blank" rel="noreferrer noopener" className="text-blue-700 dark:text-blue-300 underline">
          {m[4]}
        </a>,
      )
    }
    last = at + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

const BUTTON_STYLE: Record<NonNullable<PreviewButton["style"]>, string> = {
  primary: "bg-indigo-600 text-white",
  secondary: "bg-gray-600 text-white",
  success: "bg-green-700 text-white",
  danger: "bg-red-700 text-white",
  link: "bg-gray-600 text-white",
}

function embedColor(color: number | null): string {
  return `#${(color ?? 0x4f545c).toString(16).padStart(6, "0")}`
}

/** 只放行 http(s) 圖片網址，避免預覽載入其他協定 */
function safeImage(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}

interface Props {
  value: MessageContent
  /** 掛在訊息下方的按鈕，每 5 顆換列 */
  buttons?: PreviewButton[]
}

/** 近似 Discord 的訊息預覽：文字、embed 與按鈕列。 */
export function MessagePreview({ value, buttons = [] }: Props) {
  const e = value.embed
  const showEmbed = e !== null && !embedIsEmpty(e)
  const thumb = showEmbed ? safeImage(e.thumbnail_url) : null
  const image = showEmbed ? safeImage(e.image_url) : null
  const timestamp = showEmbed && e.extra.timestamp ? e.extra.timestamp : null
  const stampText =
    timestamp === null
      ? null
      : timestamp === "now" || Number.isNaN(Date.parse(timestamp))
        ? "送出時的時間"
        : new Date(timestamp).toLocaleString("zh-TW")

  return (
    <div aria-label="訊息預覽" className="rounded-md border border-gray-300 dark:border-gray-600 p-3 text-sm">
      {value.content && <p className="whitespace-pre-wrap break-words">{renderInline(value.content)}</p>}
      {showEmbed && (
        <div
          className="mt-2 max-w-md rounded-md border-l-4 bg-primary/5 dark:bg-champagne/5 px-3 py-2"
          style={{ borderLeftColor: embedColor(e.color) }}
        >
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              {e.author?.name && <p className="text-xs font-semibold break-words">{e.author.name}</p>}
              {e.title &&
                (e.url ? (
                  <a href={e.url} target="_blank" rel="noreferrer noopener" className="mt-1 block font-semibold break-words text-blue-700 dark:text-blue-300 hover:underline">
                    {e.title}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold break-words">{e.title}</p>
                ))}
              {e.description && <p className="mt-1 whitespace-pre-wrap break-words">{renderInline(e.description)}</p>}
              {e.fields.length > 0 && (
                <dl className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-x-4 gap-y-2">
                  {e.fields.map((f, i) => (
                    <div key={i} className={f.inline ? undefined : "col-span-full"}>
                      <dt className="text-xs font-semibold break-words">{renderInline(f.name)}</dt>
                      <dd className="whitespace-pre-wrap break-words">{renderInline(f.value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {thumb && (
              // eslint-disable-next-line @next/next/no-img-element -- 使用者填的任意外部圖片網址，預覽不走 next/image
              <img src={thumb} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
            )}
          </div>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element -- 同上
            <img src={image} alt="" className="mt-2 max-h-60 rounded object-contain" />
          )}
          {(e.footer?.text || stampText) && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 break-words">
              {[e.footer?.text, stampText].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      )}
      {!value.content && !showEmbed && <p className="text-gray-600 dark:text-gray-400">（尚無內容）</p>}
      {chunkButtons(buttons).map((row, r) => (
        <div key={r} data-max-per-row={BUTTONS_PER_ROW} className="mt-2 flex flex-wrap gap-2">
          {row.map((b, i) => (
            <span
              key={i}
              className={`rounded px-3 py-1 text-xs ${BUTTON_STYLE[b.style ?? "secondary"]} ${b.disabled ? "opacity-50" : ""}`}
            >
              {b.emoji ? `${b.emoji} ` : ""}
              {b.label}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
