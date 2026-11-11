"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Button, Input, Select } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { registerDraft } from "@/lib/dashboard-draft"
import { emptyMessage, moveItem, readBackReasonText, type FieldError, type MessageContent } from "@/lib/dashboard-message"
import {
  MAX_BUTTONS,
  MAX_BUTTON_TITLE,
  REACTION_ROLE_DRAFT_KEY,
  STYLE_OPTIONS,
  UNICODE_EMOJIS,
  alreadyReactionRoleId,
  blankButton,
  conflictValues,
  createReactionRole,
  dangerNotice,
  emojiLabel,
  fetchCandidates,
  fetchReactionRoleDetail,
  fetchReactionRoleOptions,
  formButtonsFromDetail,
  formErrors,
  hasFormErrors,
  messageLink,
  originalOf,
  parseSaveProblem,
  previewButtons,
  resolveMessageLink,
  roleOptionState,
  scopeLabel,
  splitFieldErrors,
  targetRejectText,
  toRequestButtons,
  updateReactionRole,
  type ButtonErrors,
  type Candidate,
  type FormButton,
  type OriginalSnapshot,
  type ReactionRoleDetail,
  type ReactionRoleFormDraft,
  type ReactionRoleMessage,
  type ReactionRoleOptions,
  type ResolvedMessage,
} from "@/lib/dashboard-reaction-roles"
import { ConflictNotice } from "./conflict-notice"
import { WarnIcon } from "./icons"
import { MessageEditor } from "./message-editor"

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"
const muted = "text-gray-600 dark:text-gray-400"

function Problem({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} role="alert" className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{children}</span>
    </p>
  )
}

interface Props {
  guildId: string
  /** 要編輯的訊息；null 表示新增（發新訊息或掛到既有訊息） */
  message: Pick<ReactionRoleMessage, "message_id"> | null
  /** 還原暫存時帶入使用者已輸入的內容 */
  restored?: ReactionRoleFormDraft
  onClose: () => void
  /** 存檔成功後呼叫，讓一覽重新載入 */
  onSaved: () => void
  /** 選到已經是反應身分組的訊息時，轉到那則的編輯畫面 */
  onOpenExisting?: (messageId: string) => void
}

type ExistingTarget = NonNullable<ReactionRoleFormDraft["existing"]>

interface PickerProps {
  guildId: string
  channelId: string | null
  picked: ExistingTarget | null
  busy: boolean
  onResolved: (r: ResolvedMessage) => void
}

/** 掛到既有訊息的第一步：從頻道最近的 bot 訊息挑選，或貼訊息連結。 */
function ExistingPicker({ guildId, channelId, picked, busy, onResolved }: PickerProps) {
  const uid = useId()
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [link, setLink] = useState("")
  const [problem, setProblem] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    setCandidates(null)
    setListError(null)
    if (channelId === null) return
    const controller = new AbortController()
    fetchCandidates(guildId, channelId, controller.signal)
      .then((r) => setCandidates(r.messages))
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load reaction role candidates failed", e)
        setListError(targetRejectText(e) ?? "無法載入這個頻道的訊息，請稍後再試。")
      })
    return () => controller.abort()
  }, [guildId, channelId])

  async function resolve(text: string) {
    setWorking(true)
    setProblem(null)
    try {
      onResolved(await resolveMessageLink(guildId, text))
    } catch (e) {
      const known = targetRejectText(e)
      if (known) setProblem(known)
      else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("resolve reaction role message failed", e)
        setProblem("無法讀取這則訊息，請稍後再試。")
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-1 font-medium">從頻道最近的訊息挑選</h4>
        {channelId === null ? (
          <p className={`text-sm ${muted}`}>先選擇訊息所在的頻道。</p>
        ) : listError ? (
          <Problem>{listError}</Problem>
        ) : candidates === null ? (
          <p className={`text-sm ${muted}`}>載入中…</p>
        ) : candidates.length === 0 ? (
          <p className={`text-sm ${muted}`}>最近 100 則訊息裡沒有可以掛的星羽訊息。可以改貼訊息連結。</p>
        ) : (
          <ul className="space-y-1" aria-label="可掛的訊息">
            {candidates.map((c) => (
              <li key={c.message_id}>
                <button
                  type="button"
                  disabled={busy || working}
                  aria-pressed={picked?.messageId === c.message_id}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    picked?.messageId === c.message_id
                      ? "border-primary dark:border-champagne"
                      : "border-primary/20 dark:border-champagne/25"
                  }`}
                  onClick={() => void resolve(messageLink(guildId, channelId, c.message_id))}
                >
                  <span className="block truncate">{c.summary}</span>
                  <span className={`block text-xs ${muted}`}>
                    {new Date(c.created_at).toLocaleString("zh-TW")}
                    {c.status === "reaction_role" ? "｜已是反應身分組，點選後進入編輯" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label htmlFor={`${uid}-link`} className={labelClass}>
          或貼上訊息連結
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id={`${uid}-link`}
            value={link}
            placeholder="https://discord.com/channels/…"
            disabled={busy || working}
            onChange={(e) => setLink(e.target.value)}
            className="min-w-0 flex-1"
          />
          <Button type="button" disabled={busy || working || !link.trim()} onClick={() => void resolve(link.trim())}>
            使用這則訊息
          </Button>
        </div>
      </div>
      {problem && <Problem>{problem}</Problem>}
      {picked && (
        <p role="status" className="text-sm">
          已選擇：{picked.summary}（
          <a href={picked.jumpUrl} target="_blank" rel="noreferrer" className="underline">
            在 Discord 開啟
          </a>
          ）
        </p>
      )}
    </div>
  )
}

interface ButtonRowProps {
  index: number
  button: FormButton
  buttons: FormButton[]
  options: ReactionRoleOptions
  error?: string
  busy: boolean
  onChange: (patch: Partial<FormButton>) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}

function ButtonRow({ index, button, buttons, options, error, busy, onChange, onMove, onRemove }: ButtonRowProps) {
  const uid = useId()
  const role = options.roles.find((r) => r.id === button.role_id)
  const danger = dangerNotice(role)
  const disabled = busy || button.locked
  const emojiKnown =
    !button.emoji || UNICODE_EMOJIS.includes(button.emoji) || options.emojis.some((e) => e.value === button.emoji)
  const errorId = `${uid}-error`
  return (
    <li className="rounded-md border border-primary/20 dark:border-champagne/25 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-role`} className={labelClass}>
            身分組
          </label>
          <Select
            id={`${uid}-role`}
            value={button.role_id ?? ""}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange({ role_id: e.target.value || null })}
          >
            <option value="">選擇身分組</option>
            {button.role_id !== null && !role && <option value={button.role_id}>（身分組已刪除）</option>}
            {options.roles.map((r) => {
              const state = roleOptionState(r, button, buttons)
              return (
                <option key={r.id} value={r.id} disabled={state.disabled}>
                  {r.name}
                  {state.reason ? `（${state.reason}）` : ""}
                </option>
              )
            })}
          </Select>
        </div>
        <div>
          <label htmlFor={`${uid}-title`} className={labelClass}>
            標題（最多 {MAX_BUTTON_TITLE} 字）
          </label>
          <Input
            id={`${uid}-title`}
            value={button.title}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-emoji`} className={labelClass}>
            Emoji（選填）
          </label>
          <Select
            id={`${uid}-emoji`}
            value={button.emoji ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ emoji: e.target.value || null })}
          >
            <option value="">（無）</option>
            {!emojiKnown && button.emoji && <option value={button.emoji}>{emojiLabel(button.emoji)}（無法使用）</option>}
            <optgroup label="Unicode emoji">
              {UNICODE_EMOJIS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </optgroup>
            {options.emojis.length > 0 && (
              <optgroup label="伺服器自訂 emoji">
                {options.emojis.map((e) => (
                  <option key={e.id} value={e.value}>
                    :{e.name}:
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </div>
        <div>
          <label htmlFor={`${uid}-style`} className={labelClass}>
            樣式
          </label>
          <Select
            id={`${uid}-style`}
            value={button.style}
            disabled={disabled}
            onChange={(e) => onChange({ style: Number(e.target.value) })}
          >
            {STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {button.locked && (
        <p className={`mt-2 text-sm ${muted}`}>這顆按鈕的身分組位階不低於你的最高身分組，只能刪除，不能修改。</p>
      )}
      {danger && (
        <p role="status" className="mt-2 flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{danger}</span>
        </p>
      )}
      {error && <Problem id={errorId}>{error}</Problem>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={busy || index === 0} onClick={() => onMove(-1)} aria-label={`第 ${index + 1} 顆按鈕上移`}>
          上移
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || index === buttons.length - 1}
          onClick={() => onMove(1)}
          aria-label={`第 ${index + 1} 顆按鈕下移`}
        >
          下移
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={onRemove}
          aria-label={`刪除第 ${index + 1} 顆按鈕`}
          className="ml-auto"
        >
          刪除
        </Button>
      </div>
    </li>
  )
}

/** 發新的反應身分組訊息，或編輯既有訊息的內容與按鈕。 */
export function ReactionRoleForm({ guildId, message, restored, onClose, onSaved, onOpenExisting }: Props) {
  const [options, setOptions] = useState<ReactionRoleOptions | null>(null)
  const [optionsError, setOptionsError] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [ready, setReady] = useState(restored !== undefined || message === null)

  const [messageId, setMessageId] = useState<string | null>(restored ? restored.messageId : (message?.message_id ?? null))
  const [channelId, setChannelId] = useState<string | null>(restored ? restored.channelId : null)
  const [source, setSource] = useState<"new" | "existing">(restored?.source ?? "new")
  const [existing, setExisting] = useState<ExistingTarget | null>(restored?.existing ?? null)
  const [original, setOriginal] = useState<OriginalSnapshot | null>(restored ? restored.original : null)
  const [content, setContent] = useState<MessageContent>(restored?.message ?? emptyMessage())
  const [contentLocked, setContentLocked] = useState<string | null>(restored ? restored.contentLocked : null)
  const [buttons, setButtons] = useState<FormButton[]>(restored ? restored.buttons : [blankButton()])

  const [errors, setErrors] = useState<{ message: FieldError[]; buttons: ButtonErrors }>({ message: [], buttons: {} })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ latest: ReactionRoleDetail | null } | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
    headingRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchReactionRoleOptions(guildId, controller.signal)
      .then(setOptions)
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load reaction role options failed", e)
        setOptionsError(true)
      })
    return () => controller.abort()
  }, [guildId])

  // 編輯既有訊息：載入內容與按鈕（還原暫存時已有，不重新載入）
  useEffect(() => {
    if (restored || message === null) return
    const controller = new AbortController()
    fetchReactionRoleDetail(guildId, message.message_id, controller.signal)
      .then((d) => {
        applyDetail(d)
        setReady(true)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load reaction role detail failed", e)
        setLoadError(true)
      })
    return () => controller.abort()
    // 只在掛載時載入一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId])

  function applyDetail(d: ReactionRoleDetail) {
    setMessageId(d.message_id)
    setChannelId(d.channel.invalid ? null : d.channel.id)
    setOriginal(originalOf(d))
    setContent(d.content ?? emptyMessage())
    setContentLocked(d.content_locked)
    setButtons(formButtonsFromDetail(d.buttons))
  }

  const stateRef = useRef<ReactionRoleFormDraft>({
    messageId,
    source,
    existing,
    channelId,
    original,
    message: contentLocked ? null : content,
    contentLocked,
    buttons,
  })
  stateRef.current = {
    messageId,
    source,
    existing,
    channelId,
    original,
    message: contentLocked ? null : content,
    contentLocked,
    buttons,
  }
  const mode = messageId === null ? "create" : "edit"
  useEffect(
    () => (ready ? registerDraft(REACTION_ROLE_DRAFT_KEY, mode, () => stateRef.current) : undefined),
    [mode, ready],
  )

  const isCreate = messageId === null
  const isAttach = isCreate && source === "existing"
  // 掛到既有訊息時，選定訊息之前不顯示內容與按鈕
  const showBody = !isAttach || existing !== null
  const selectedChannel = options?.channels.find((c) => c.id === channelId) ?? null
  const roleName = (id: string | null) => options?.roles.find((r) => r.id === id)?.name ?? null

  function patchButton(key: string, patch: Partial<FormButton>) {
    setButtons((list) => list.map((b) => (b.key === key ? { ...b, ...patch } : b)))
    setErrors((e) => ({ ...e, buttons: { ...e.buttons, [key]: "" } }))
  }

  function pickResolved(r: ResolvedMessage) {
    if (r.status === "reaction_role") {
      onOpenExisting?.(r.message_id)
      return
    }
    setChannelId(r.channel.id)
    setExisting({ messageId: r.message_id, jumpUrl: r.jump_url, summary: r.summary })
    setContent(r.content ?? emptyMessage())
    setContentLocked(r.content_locked)
    setErrors({ message: [], buttons: {} })
    setNotice(null)
  }

  async function submit(against: OriginalSnapshot | null, asNew = isCreate) {
    if (asNew && source === "existing" && existing === null) {
      setNotice("請先選擇要掛的訊息。")
      return
    }
    const found = formErrors(contentLocked ? null : content, buttons)
    setErrors(found)
    if (hasFormErrors(found) || (asNew && channelId === null)) {
      if (asNew && channelId === null) setNotice("請選擇要發送的頻道。")
      return
    }
    setBusy(true)
    setNotice(null)
    setConflict(null)
    try {
      if (asNew) {
        await createReactionRole(guildId, {
          target:
            source === "existing" && existing !== null
              ? { kind: "existing", channel_id: channelId ?? "", message_id: existing.messageId }
              : { kind: "new", channel_id: channelId ?? "" },
          message: contentLocked ? null : content,
          buttons: toRequestButtons(buttons),
        })
      } else {
        await updateReactionRole(guildId, messageId ?? "", {
          message: contentLocked ? null : content,
          buttons: toRequestButtons(buttons),
          original: against as OriginalSnapshot,
        })
      }
      onSaved()
      onClose()
    } catch (e) {
      const registeredId = alreadyReactionRoleId(e)
      if (registeredId && onOpenExisting) {
        onOpenExisting(registeredId)
        return
      }
      const problem = parseSaveProblem(e)
      if (!problem) {
        if (!(e instanceof DashboardApiError && e.handled)) {
          console.error("save reaction role failed", e)
          setNotice("儲存失敗，請稍後再試。")
        }
      } else if (problem.kind === "conflict") {
        setConflict({ latest: problem.latest })
      } else if (problem.kind === "invalid" || problem.kind === "locked_button") {
        const split = splitFieldErrors(problem.fields, buttons)
        setErrors(split)
        if (split.message.length === 0 && Object.keys(split.buttons).length === 0) setNotice("內容不符合規則，請檢查後再試。")
      } else if (problem.kind === "content_locked") {
        setNotice(`這則訊息的內容不能修改：${problem.text}`)
      } else if (problem.kind === "bot_missing_permission") {
        setNotice(problem.text)
      } else if (problem.kind === "target_rejected") {
        setNotice(problem.text)
      } else if (problem.kind === "message_not_found") {
        setNotice("在 Discord 上找不到這則訊息，無法更新。")
      } else if (problem.kind === "discord_error") {
        setNotice(`Discord 拒絕了這次更新${problem.text ? `：${problem.text}` : ""}。`)
      } else {
        setNotice("儲存失敗，Discord 上的訊息已改回原樣，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  const formatConflict = (_field: string, value: string | null) => (value ? value : "無")
  const latestValues = (d: ReactionRoleDetail) =>
    conflictValues(
      d.content,
      d.buttons.map((b) => ({ title: b.title, emoji: b.emoji, roleName: b.role.name })),
    )
  const mineValues = conflictValues(
    contentLocked ? null : content,
    buttons.map((b) => ({ title: b.title, emoji: b.emoji, roleName: roleName(b.role_id) })),
  )

  const title = !isCreate ? "編輯反應身分組" : isAttach ? "把反應身分組掛到既有訊息" : "發新的反應身分組訊息"

  return (
    <form
      className="mt-4 space-y-5 rounded-md border border-primary/20 dark:border-champagne/25 p-4"
      aria-label={title}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit(original)
      }}
    >
      <h3 ref={headingRef} tabIndex={-1} className="font-serif text-lg text-primary dark:text-silver outline-none">
        {title}
      </h3>

      {optionsError && <p className="text-sm text-red-700 dark:text-red-300">無法載入頻道與身分組選項，請重新整理。</p>}
      {loadError && <p className="text-sm text-red-700 dark:text-red-300">無法載入這則訊息，請關閉後重試。</p>}
      {!ready && !loadError && <p className={muted}>載入中…</p>}

      {ready && (
        <>
          {isCreate && (
            <fieldset className="space-y-2">
              <legend className="mb-1 font-medium">要怎麼放</legend>
              {(
                [
                  ["new", "發新訊息"],
                  ["existing", "掛到既有訊息"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="mr-4 inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="rr-source"
                    value={value}
                    checked={source === value}
                    disabled={busy}
                    onChange={() => {
                      setSource(value)
                      setExisting(null)
                      setNotice(null)
                    }}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          )}

          {isCreate && (
            <div>
              <label htmlFor="rr-channel" className={labelClass}>
                {isAttach ? "訊息所在的頻道" : "發送到哪個頻道（必填）"}
              </label>
              <Select
                id="rr-channel"
                value={channelId ?? ""}
                disabled={busy || options === null}
                onChange={(e) => {
                  setChannelId(e.target.value || null)
                  setExisting(null)
                }}
              >
                {options === null ? (
                  <option value="">載入中…</option>
                ) : (
                  <>
                    <option value="">選擇文字頻道</option>
                    {options.channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category ?? "（無分類）"} / {c.name}
                      </option>
                    ))}
                  </>
                )}
              </Select>
              {selectedChannel && selectedChannel.permission_issues.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {selectedChannel.permission_issues.map((i) => (
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
          )}

          {isAttach && (
            <ExistingPicker guildId={guildId} channelId={channelId} picked={existing} busy={busy} onResolved={pickResolved} />
          )}

          {showBody && (
          <>
          <section aria-labelledby="rr-content-heading">
            <h4 id="rr-content-heading" className="mb-2 font-medium">
              訊息內容
            </h4>
            {contentLocked ? (
              <p role="status" className="rounded-md border border-amber-600/50 dark:border-amber-400/50 px-3 py-2 text-sm">
                這則訊息的內容不能在這裡修改，只能管理按鈕：{readBackReasonText(contentLocked)}
              </p>
            ) : (
              <MessageEditor
                value={content}
                onChange={(next) => {
                  setContent(next)
                  setErrors((e) => ({ ...e, message: [] }))
                }}
                errors={errors.message}
                buttons={previewButtons(buttons)}
              />
            )}
          </section>

          <section aria-labelledby="rr-buttons-heading">
            <h4 id="rr-buttons-heading" className="mb-2 font-medium">
              按鈕（{buttons.length}／{MAX_BUTTONS}）
            </h4>
            <p className={`mb-3 text-sm ${muted}`}>
              每 5 顆自動換一列。成員按一下取得身分組，再按一次移除。bot 的最高身分組必須高於要發放的身分組。
            </p>
            {errors.buttons._ && <Problem>{errors.buttons._}</Problem>}
            <ul className="space-y-3">
              {buttons.map((b, i) => (
                <ButtonRow
                  key={b.key}
                  index={i}
                  button={b}
                  buttons={buttons}
                  options={options ?? { channels: [], roles: [], emojis: [] }}
                  error={errors.buttons[b.key] || undefined}
                  busy={busy || options === null}
                  onChange={(patch) => patchButton(b.key, patch)}
                  onMove={(delta) => setButtons((list) => moveItem(list, i, delta))}
                  onRemove={() => setButtons((list) => list.filter((x) => x.key !== b.key))}
                />
              ))}
            </ul>
            <Button
              type="button"
              className="mt-3"
              disabled={busy || buttons.length >= MAX_BUTTONS}
              onClick={() => setButtons((list) => [...list, blankButton()])}
            >
              新增按鈕
            </Button>
          </section>
          </>
          )}
        </>
      )}

      {conflict && (
        <ConflictNotice
          subject="這則反應身分組"
          current={conflict.latest ? latestValues(conflict.latest) : null}
          mine={mineValues}
          format={formatConflict}
          busy={busy}
          onOverwrite={() => {
            const latest = conflict.latest
            if (!latest) return
            const against = originalOf(latest)
            setOriginal(against)
            setContentLocked(latest.content_locked)
            void submit(against)
          }}
          onRecreate={() => {
            // 紀錄已被刪除：改成在原頻道重新發一則
            setMessageId(null)
            void submit(null, true)
          }}
        />
      )}
      {notice && <Problem>{notice}</Problem>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || !ready}>
          {isAttach ? "掛上按鈕" : isCreate ? "發送" : "儲存"}
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
      </div>
    </form>
  )
}
