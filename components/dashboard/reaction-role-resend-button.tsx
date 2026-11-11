"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button, Select } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { emptyMessage, validateMessage, type FieldError, type MessageContent } from "@/lib/dashboard-message"
import {
  fetchReactionRoleDetail,
  fetchReactionRoleOptions,
  parseResendProblem,
  previewButtons,
  formButtonsFromDetail,
  resendContentNotice,
  resendReactionRole,
  scopeLabel,
  skippedByResend,
  type ReactionRoleDetail,
  type ReactionRoleMessage,
  type ReactionRoleOptions,
  type ResendResult,
} from "@/lib/dashboard-reaction-roles"
import { WarnIcon } from "./icons"
import { MessageEditor } from "./message-editor"

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"
const muted = "text-gray-600 dark:text-gray-400"

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{children}</span>
    </p>
  )
}

/**
 * 失效訊息的「重新發送」：選頻道（預設原頻道，原頻道已刪除時必須重選），
 * 沿用最後記錄的內容與有效的按鈕；沒有可用的內容時開編輯器重新編排。
 */
export function ReactionRoleResendButton({
  guildId,
  message,
  onDone,
}: {
  guildId: string
  message: ReactionRoleMessage
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<ReactionRoleDetail | null>(null)
  const [options, setOptions] = useState<ReactionRoleOptions | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [channelId, setChannelId] = useState<string>(message.channel.invalid ? "" : message.channel.id)
  const [content, setContent] = useState<MessageContent>(emptyMessage())
  const [contentErrors, setContentErrors] = useState<FieldError[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResendResult | null>(null)
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()
  const channelLabel = message.channel.name ? `#${message.channel.name}` : "此訊息"

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setDetail(null)
    setOptions(null)
    setLoadFailed(false)
    Promise.all([
      fetchReactionRoleDetail(guildId, message.message_id, controller.signal),
      fetchReactionRoleOptions(guildId, controller.signal),
    ])
      .then(([d, o]) => {
        setDetail(d)
        setOptions(o)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load reaction role resend data failed", e)
        setLoadFailed(true)
      })
    return () => controller.abort()
    // 只在開啟時載入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guildId, message.message_id])

  const notice = detail ? resendContentNotice(detail) : null
  const needsContent = detail !== null && detail.content === null
  const skipped = detail ? skippedByResend(detail.buttons) : []
  const channel = options?.channels.find((c) => c.id === channelId) ?? null

  const close = () => {
    const finished = result !== null
    setOpen(false)
    setError(null)
    setResult(null)
    setContentErrors([])
    if (finished) onDone()
  }

  async function send() {
    if (!detail) return
    if (channelId === "") {
      setError("請選擇要發送的頻道。")
      return
    }
    if (needsContent) {
      const found = validateMessage(content)
      setContentErrors(found)
      if (found.length > 0) return
    }
    setBusy(true)
    setError(null)
    try {
      setResult(
        await resendReactionRole(guildId, message.message_id, {
          channel_id: channelId,
          message: needsContent ? content : null,
        }),
      )
    } catch (e) {
      const problem = parseResendProblem(e)
      if (!problem) {
        if (!(e instanceof DashboardApiError && e.handled)) {
          console.error("resend reaction role failed", e)
          setError("重新發送失敗，請稍後再試。")
        }
      } else if (problem.kind === "invalid") {
        const forContent = problem.fields.filter((f) => f.path !== "channel_id" && f.path !== "message")
        const channelProblem = problem.fields.find((f) => f.path === "channel_id")
        const contentProblem = problem.fields.find((f) => f.path === "message")
        setContentErrors(forContent)
        setError(channelProblem?.reason ?? contentProblem?.reason ?? (forContent.length > 0 ? null : "內容不符合規則，請檢查後再試。"))
      } else if (problem.kind === "no_valid_buttons") {
        setError("這則的按鈕全都失效了，沒有可以重新發送的按鈕。請改用「移除紀錄」，或重新建立。")
      } else if (problem.kind === "message_exists") {
        setError("這則訊息在 Discord 上又出現了，不需要重新發送。請關閉後重新整理。")
      } else if (problem.kind === "not_found") {
        setError("這筆紀錄已被移除。請關閉後重新整理。")
      } else if (problem.kind === "bot_missing_permission") {
        setError(problem.text)
      } else if (problem.kind === "discord_error") {
        setError(`Discord 拒絕了這次發送${problem.text ? `：${problem.text}` : ""}。`)
      } else {
        setError("儲存失敗，剛發出的訊息已刪除，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
        onClick={() => setOpen(true)}
      >
        重新發送<span className="sr-only">（{channelLabel}）</span>
      </button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        onCancel={(e) => {
          e.preventDefault()
          if (!busy) close()
        }}
        onClose={() => {
          if (open) close()
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
      >
        <h3 id={`${uid}-title`} className="font-serif text-lg text-primary dark:text-silver">
          重新發送反應身分組
        </h3>

        {result ? (
          <div className="mt-3 space-y-3 text-sm">
            <p role="status">
              已重新發送，按鈕可以正常使用。
              <a href={result.jump_url} target="_blank" rel="noreferrer" className="ml-1 underline">
                在 Discord 開啟
              </a>
            </p>
            {result.skipped.length > 0 && (
              <div>
                <p>下列失效的按鈕沒有一起發送：</p>
                <ul className="mt-1 list-disc pl-5">
                  {result.skipped.map((s) => (
                    <li key={s.role_id}>
                      {s.title}：{s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button type="button" onClick={close}>
              完成
            </Button>
          </div>
        ) : (
          <>
            {loadFailed && <Problem>無法載入這則的內容與頻道選項，請關閉後重試。</Problem>}
            {!detail && !loadFailed && <p className={`mt-3 text-sm ${muted}`}>載入中…</p>}
            {detail && (
              <div className="mt-3 space-y-4">
                <div>
                  <label htmlFor={`${uid}-channel`} className={labelClass}>
                    發送到哪個頻道
                  </label>
                  <Select
                    id={`${uid}-channel`}
                    value={channelId}
                    disabled={busy || options === null}
                    onChange={(e) => {
                      setChannelId(e.target.value)
                      setError(null)
                    }}
                  >
                    <option value="">選擇文字頻道</option>
                    {(options?.channels ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category ?? "（無分類）"} / {c.name}
                        {c.id === message.channel.id ? "（原頻道）" : ""}
                      </option>
                    ))}
                  </Select>
                  {message.channel.invalid && (
                    <p className={`mt-1 text-sm ${muted}`}>原頻道已被刪除，請重新選擇頻道。</p>
                  )}
                  {channel && channel.permission_issues.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {channel.permission_issues.map((i) => (
                        <li key={i.permission} className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
                          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
                          <span>
                            bot 在{scopeLabel(i.scope)}缺少 {i.permission}：{i.consequence}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {needsContent ? (
                  <section aria-labelledby={`${uid}-content`}>
                    <h4 id={`${uid}-content`} className="mb-1 font-medium">
                      訊息內容
                    </h4>
                    <p role="status" className="mb-2 rounded-md border border-amber-600/50 dark:border-amber-400/50 px-3 py-2 text-sm">
                      {notice}。請用下面的編輯器重新編排內容，或關閉視窗後改用「移除紀錄」。
                    </p>
                    <MessageEditor
                      value={content}
                      onChange={(next) => {
                        setContent(next)
                        setContentErrors([])
                      }}
                      errors={contentErrors}
                      buttons={previewButtons(formButtonsFromDetail(detail.buttons.filter((b) => skippedByResend([b]).length === 0)))}
                    />
                  </section>
                ) : (
                  <p className="text-sm">會使用最後記錄的訊息內容重新發送。</p>
                )}

                {skipped.length > 0 && (
                  <div role="status" className="text-sm">
                    <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
                      <span>下列按鈕已失效，重新發送時會略過：</span>
                    </p>
                    <ul className="mt-1 list-disc pl-5">
                      {skipped.map((s, i) => (
                        <li key={i}>
                          {s.title}（{s.reasons.join("；")}）
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {error && <Problem>{error}</Problem>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" disabled={busy || detail === null} onClick={send}>
                重新發送
              </Button>
              <Button type="button" disabled={busy} onClick={close}>
                取消
              </Button>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
