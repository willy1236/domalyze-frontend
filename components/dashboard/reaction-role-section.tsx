"use client"

import { useCallback, type ReactNode } from "react"
import { Button } from "@/components/ui"
import {
  buttonProblems,
  emojiLabel,
  fetchReactionRoles,
  messageInvalidReason,
  scopeLabel,
  type ReactionRoleMessage,
} from "@/lib/dashboard-reaction-roles"
import { useLoad } from "@/lib/use-load"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
const warnBox = "mt-2 rounded-sm border border-amber-600/50 dark:border-amber-400/50 px-3 py-2 text-sm"

function summaryText(message: ReactionRoleMessage, invalidReason: string | null): string {
  if (message.summary) return message.summary
  if (invalidReason) return "（讀不到訊息內容）"
  return message.summary === "" ? "（沒有文字內容）" : "（目前讀不到訊息內容）"
}

/** 一則反應身分組訊息；`actions` 是 R-02、R-04 放編輯與刪除按鈕的插槽。 */
export function ReactionRoleItem({ message, actions }: { message: ReactionRoleMessage; actions?: ReactNode }) {
  const invalidReason = messageInvalidReason(message)
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-serif text-lg text-primary dark:text-silver break-words">
          {message.channel.name ? `#${message.channel.name}` : "頻道已不存在"}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a href={message.jump_url} target="_blank" rel="noopener noreferrer" className={`underline ${linkClass}`}>
            在 Discord 開啟<span className="sr-only">（新分頁）</span>
          </a>
          {actions}
        </div>
      </div>

      {invalidReason && (
        <p className={warnBox} role="status">
          <strong>已失效：</strong>
          {invalidReason}，按鈕已經無法使用。
        </p>
      )}

      <p className={`mt-2 text-sm break-words ${message.summary ? "" : muted}`}>{summaryText(message, invalidReason)}</p>

      {message.buttons.length === 0 ? (
        <p className={`mt-2 text-sm ${muted}`}>這則訊息沒有任何按鈕。</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {message.buttons.map((b) => {
            const problems = buttonProblems(b)
            const emoji = emojiLabel(b.emoji)
            return (
              <li
                key={b.role.id}
                className={`rounded-sm border px-3 py-1.5 text-sm ${
                  problems.length > 0
                    ? "border-amber-600/60 dark:border-amber-400/60"
                    : "border-primary/25 dark:border-champagne/30"
                }`}
              >
                <span className="font-medium break-words">
                  {emoji && <span className={b.emoji_invalid ? "line-through" : ""}>{emoji} </span>}
                  {b.title}
                </span>
                <span className={`block ${muted}`}>→ {b.role.name ? `@${b.role.name}` : `身分組 ${b.role.id}`}</span>
                {problems.length > 0 && (
                  <span className="block text-amber-700 dark:text-amber-300">失效：{problems.join("；")}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {message.permission_issues.length > 0 && (
        <div className={warnBox} role="status">
          <p className="font-medium">bot 缺少下列權限，仍可存檔，但會有以下後果：</p>
          <ul className="mt-1 list-disc pl-5">
            {message.permission_issues.map((i) => (
              <li key={`${i.scope}-${i.permission}`}>
                {scopeLabel(i.scope)}的 {i.permission}：{i.consequence}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

interface ReactionRoleSectionProps {
  guildId: string
  /** 標題列右側的插槽（R-02 放新增按鈕）；收到重新載入函式 */
  headerActions?: (reload: () => void) => ReactNode
  /** 每則訊息的動作插槽（R-02 編輯、R-04 刪除與重新發送） */
  actions?: (message: ReactionRoleMessage, reload: () => void) => ReactNode
}

/** 反應身分組一覽：進入頁面時載入並檢查 Discord 現況，另有手動重新整理。 */
export function ReactionRoleSection({ guildId, headerActions, actions }: ReactionRoleSectionProps) {
  const fetcher = useCallback(async (signal: AbortSignal) => (await fetchReactionRoles(guildId, signal)).messages, [guildId])
  const { data: messages, failed, loading, reload: load } = useLoad(fetcher)
  const reload = useCallback(() => void load(), [load])

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">反應身分組</h2>
        <div className="flex flex-wrap items-center gap-3">
          {headerActions?.(reload)}
          <Button type="button" size="sm" disabled={loading} onClick={reload}>
            重新整理
          </Button>
        </div>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入反應身分組，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={reload}>
            重試
          </button>
          。
        </p>
      )}
      {messages === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {messages &&
        (messages.length === 0 ? (
          <p className={`py-8 ${muted}`}>
            目前沒有反應身分組。反應身分組是訊息下方的按鈕，成員按一下就能取得或移除身分組；bot 的最高身分組位階必須高於要發放的身分組，才能發放。
          </p>
        ) : (
          <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
            {messages.map((m) => (
              <ReactionRoleItem key={m.message_id} message={m} actions={actions?.(m, reload)} />
            ))}
          </ul>
        ))}
    </section>
  )
}
