import { renderMentions, type PreviewEmbed, type PreviewResult } from "@/lib/dashboard-preview"

function embedColor(color: number | undefined): string {
  return `#${(color ?? 0x4f545c).toString(16).padStart(6, "0")}`
}

function Embed({ embed, role }: { embed: PreviewEmbed; role: { id: string | null; name: string | null } }) {
  const text = (value: string) => renderMentions(value, role.id, role.name)
  return (
    <div
      className="mt-2 max-w-md rounded-md border-l-4 bg-primary/5 dark:bg-champagne/5 px-3 py-2 text-sm"
      style={{ borderLeftColor: embedColor(embed.color) }}
    >
      {embed.author?.name && <p className="text-xs font-semibold break-words">{embed.author.name}</p>}
      {embed.title && <p className="mt-1 font-semibold break-words">{embed.title}</p>}
      {embed.description && <p className="mt-1 whitespace-pre-wrap break-words">{text(embed.description)}</p>}
      {embed.fields && embed.fields.length > 0 && (
        <dl className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-x-4 gap-y-2">
          {embed.fields.map((f, i) => (
            <div key={i} className={f.inline === false ? "col-span-full" : undefined}>
              <dt className="text-xs font-semibold break-words">{f.name}</dt>
              <dd className="whitespace-pre-wrap break-words">{text(f.value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {embed.footer?.text && <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 break-words">{embed.footer.text}</p>}
    </div>
  )
}

interface Props {
  /** 預覽 API 的結果；null 表示尚未載入 */
  preview: PreviewResult | null
  error?: boolean
}

/** 範例訊息的大致外觀：文字、身分組提及與 embed。T-06、T-07 共用。 */
export function NotifyPreview({ preview, error }: Props) {
  if (!preview) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">{error ? "無法載入預覽。" : "預覽載入中…"}</p>
  }
  const role = { id: preview.mention_role_id, name: preview.mention_role_name }
  return (
    <div aria-label="預覽" className="rounded-md border border-gray-300 dark:border-gray-600 p-3">
      {error && <p className="mb-2 text-xs text-red-700 dark:text-red-300">預覽更新失敗，顯示的是上一次的結果。</p>}
      {preview.content && (
        <p className="whitespace-pre-wrap break-words text-sm">
          {renderMentions(preview.content, role.id, role.name)}
        </p>
      )}
      {preview.embeds.map((embed, i) => (
        <Embed key={i} embed={embed} role={role} />
      ))}
      <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">範例內容，實際通知的資料會不同。</p>
    </div>
  )
}
