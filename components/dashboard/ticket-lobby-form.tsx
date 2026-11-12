"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Button, Input, Select } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { registerDraft } from "@/lib/dashboard-draft"
import type { FieldError, MessageContent } from "@/lib/dashboard-message"
import { UNICODE_EMOJIS } from "@/lib/dashboard-reaction-roles"
import {
  DEFAULT_BUTTON_LABEL,
  MAX_BUTTON_LABEL,
  MAX_PREFIX,
  TICKET_DRAFT_KEY,
  createLobby,
  emojiText,
  fetchLobbyDetail,
  fetchLobbyOptions,
  hasLobbyErrors,
  lobbyConflictValues,
  lobbyPreviewButtons,
  newLobbyMessage,
  parseLobbySaveProblem,
  parseMaxOpen,
  prefixExample,
  splitLobbyFieldErrors,
  targetLabel,
  updateLobby,
  validateLobbyForm,
  type LobbyDetail,
  type LobbyFormDraft,
  type LobbyFormErrors,
  type LobbyOptions,
  type LobbyOriginal,
  type LobbyPermissionIssue,
  type LobbyRequest,
  type LobbySaveResult,
} from "@/lib/dashboard-tickets"
import { ConflictNotice } from "./conflict-notice"
import { WarnIcon } from "./icons"
import { MessageEditor } from "./message-editor"
import { RoleMultiSelect } from "./role-multi-select"

/** 表單上有對應位置顯示錯誤的欄位 */
const SHOWN_FIELDS = new Set([
  "lobby_channel",
  "lobby_channel.name",
  "lobby_channel.category_id",
  "ticket_category_id",
  "manager_role_ids",
  "name_prefix",
  "max_open",
  "button_label",
  "button_emoji",
])

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

function Issues({ issues }: { issues: LobbyPermissionIssue[] }) {
  if (issues.length === 0) return null
  return (
    <ul className="mt-2 space-y-1">
      {issues.map((i) => (
        <li key={i.permission} className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>
            bot 在{targetLabel(i.target)}缺少 {i.permission}：{i.consequence}。仍可儲存。
          </span>
        </li>
      ))}
    </ul>
  )
}

interface Props {
  guildId: string
  /** 要編輯的大廳；null 表示新增 */
  lobby: { channel: { id: string } } | null
  /** 還原暫存時帶入使用者已輸入的內容 */
  restored?: LobbyFormDraft
  onClose: () => void
  /** 存檔成功後呼叫，讓一覽重新載入 */
  onSaved: () => void
}

/** 新增大廳，或修改大廳的頻道分類、管理身分組、前綴、開單限制與大廳訊息。 */
export function TicketLobbyForm({ guildId, lobby, restored, onClose, onSaved }: Props) {
  const uid = useId()
  const [options, setOptions] = useState<LobbyOptions | null>(null)
  const [optionsError, setOptionsError] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [ready, setReady] = useState(restored !== undefined || lobby === null)

  const [lobbyId, setLobbyId] = useState<string | null>(restored ? restored.lobbyId : (lobby?.channel.id ?? null))
  // 修改時大廳頻道已被刪除：必須重新選頻道
  const [channelInvalid, setChannelInvalid] = useState(restored?.channelInvalid ?? false)
  const [messageInvalid, setMessageInvalid] = useState(restored?.messageInvalid ?? false)
  const [original, setOriginal] = useState<LobbyOriginal | null>(restored?.original ?? null)
  const [channelKind, setChannelKind] = useState<"existing" | "new">(restored?.channelKind ?? "existing")
  const [channelId, setChannelId] = useState<string | null>(restored?.channelId ?? null)
  const [newName, setNewName] = useState(restored?.newName ?? "")
  const [newCategoryId, setNewCategoryId] = useState<string | null>(restored?.newCategoryId ?? null)
  const [ticketCategoryId, setTicketCategoryId] = useState<string | null>(restored?.ticketCategoryId ?? null)
  const [managerRoleIds, setManagerRoleIds] = useState<string[]>(restored?.managerRoleIds ?? [])
  const [namePrefix, setNamePrefix] = useState(restored?.namePrefix ?? "ticket")
  const [onePerUser, setOnePerUser] = useState(restored?.onePerUser ?? true)
  const [maxOpen, setMaxOpen] = useState(restored?.maxOpen ?? "")
  const [message, setMessage] = useState<MessageContent>(restored?.message ?? newLobbyMessage())
  const [buttonLabel, setButtonLabel] = useState(restored?.buttonLabel ?? "")
  const [buttonEmoji, setButtonEmoji] = useState<string | null>(restored?.buttonEmoji ?? null)

  const [errors, setErrors] = useState<LobbyFormErrors>({ fields: {}, message: [] })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ latest: LobbyDetail | null } | null>(null)
  const [result, setResult] = useState<LobbySaveResult | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
    headingRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchLobbyOptions(guildId, controller.signal)
      .then(setOptions)
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load ticket lobby options failed", e)
        setOptionsError(true)
      })
    return () => controller.abort()
  }, [guildId])

  function applyDetail(d: LobbyDetail) {
    setLobbyId(d.channel.id)
    setChannelInvalid(d.invalid_reason === "channel_deleted")
    setMessageInvalid(d.invalid_reason === "message_deleted")
    setOriginal(d.original)
    setChannelKind("existing")
    setChannelId(d.invalid_reason === "channel_deleted" ? null : d.channel.id)
    setTicketCategoryId(d.ticket_category_id)
    setManagerRoleIds(d.manager_role_ids)
    setNamePrefix(d.name_prefix)
    setOnePerUser(d.one_per_user)
    setMaxOpen(d.max_open === null ? "" : String(d.max_open))
    setMessage(d.content)
    setButtonLabel(d.button_label ?? "")
    setButtonEmoji(d.button_emoji)
  }

  // 編輯既有大廳：載入設定（還原暫存時已有，不重新載入）
  useEffect(() => {
    if (restored || lobby === null) return
    const controller = new AbortController()
    fetchLobbyDetail(guildId, lobby.channel.id, controller.signal)
      .then((d) => {
        applyDetail(d)
        setReady(true)
      })
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load ticket lobby detail failed", e)
        setLoadError(true)
      })
    return () => controller.abort()
    // 只在掛載時載入一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId])

  const draft = (): LobbyFormDraft => ({
    lobbyId,
    original,
    channelKind,
    channelId,
    newName,
    newCategoryId,
    ticketCategoryId,
    managerRoleIds,
    namePrefix,
    onePerUser,
    maxOpen,
    message,
    buttonLabel,
    buttonEmoji,
    channelInvalid,
    messageInvalid,
  })
  const stateRef = useRef<LobbyFormDraft>(draft())
  // 暫存只在工作階段過期時讀取，render 之後再同步即可
  useEffect(() => {
    stateRef.current = draft()
  })
  const mode = lobbyId === null ? "create" : "edit"
  useEffect(() => (ready && !result ? registerDraft(TICKET_DRAFT_KEY, mode, () => stateRef.current) : undefined), [mode, ready, result])

  const isCreate = lobbyId === null
  const needsChannel = isCreate || channelInvalid
  // 分類已被刪除（不在選項裡）視同沒選，必須重新選
  const categoryValue = options?.categories.some((c) => c.id === ticketCategoryId) ? ticketCategoryId : null
  const selectedChannel = options?.channels.find((c) => c.id === channelId) ?? null
  const selectedCategory = options?.categories.find((c) => c.id === categoryValue) ?? null
  const newCategory = options?.categories.find((c) => c.id === newCategoryId) ?? null
  const roleName = (id: string) => options?.roles.find((r) => r.id === id)?.name ?? id
  const fieldError = (name: string) => errors.fields[name]
  const clear = (name: string) => setErrors((e) => ({ ...e, fields: { ...e.fields, [name]: "" } }))

  async function submit(against: LobbyOriginal | null, asNew = isCreate, forceChannel: string | null = null) {
    const pickedChannelId = forceChannel ?? channelId
    const found = validateLobbyForm({
      channelKind: forceChannel ? "existing" : channelKind,
      channelId: pickedChannelId,
      newName,
      newCategoryId,
      ticketCategoryId: categoryValue,
      namePrefix,
      maxOpen,
      buttonLabel,
      message,
      needsChannel: asNew || channelInvalid,
    })
    setErrors(found)
    if (hasLobbyErrors(found)) return
    const request: LobbyRequest = {
      lobby_channel:
        (asNew || channelInvalid) && !forceChannel && channelKind === "new"
          ? { kind: "new", name: newName.trim(), category_id: newCategoryId ?? "" }
          : { kind: "existing", id: (asNew || channelInvalid ? pickedChannelId : lobbyId) ?? "" },
      ticket_category_id: categoryValue ?? "",
      manager_role_ids: managerRoleIds,
      name_prefix: namePrefix,
      one_per_user: onePerUser,
      max_open: parseMaxOpen(maxOpen) ?? null,
      message,
      button_label: buttonLabel.trim() || null,
      button_emoji: buttonEmoji,
    }
    setBusy(true)
    setNotice(null)
    setConflict(null)
    try {
      const saved = asNew
        ? await createLobby(guildId, request)
        : await updateLobby(guildId, lobbyId ?? "", { ...request, original: against as LobbyOriginal })
      onSaved()
      if (saved.failures.length > 0) setResult(saved)
      else onClose()
    } catch (e) {
      const problem = parseLobbySaveProblem(e)
      if (!problem) {
        if (!(e instanceof DashboardApiError && e.handled)) {
          console.error("save ticket lobby failed", e)
          setNotice("儲存失敗，請稍後再試。")
        }
      } else if (problem.kind === "conflict") {
        setConflict({ latest: problem.latest })
      } else if (problem.kind === "invalid") {
        applyFieldErrors(problem.fields)
      } else if (problem.kind === "discord_error") {
        setNotice(`Discord 拒絕了這次操作${problem.text ? `：${problem.text}` : ""}。`)
      } else if (problem.kind === "bot_missing_permission") {
        setNotice(`${problem.text}。`)
      } else if (problem.kind === "guild_unavailable") {
        setNotice("Discord 目前無法讀取這個伺服器，請稍後再試。")
      } else if (problem.kind === "not_found") {
        setNotice("找不到這個大廳，可能已被移除。")
      } else {
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  function applyFieldErrors(fields: FieldError[]) {
    const split = splitLobbyFieldErrors(fields)
    // 大廳頻道在後端被判定不能用（例如表單開著時被刪除）：改成要求重新選頻道
    if (!needsChannel && split.fields.lobby_channel) {
      setChannelInvalid(true)
      setChannelId(null)
    }
    setErrors(split)
    // 畫面上沒有對應欄位的錯誤改用提示顯示，不能讓儲存無聲失敗
    const unmatched = Object.entries(split.fields).filter(([key]) => !SHOWN_FIELDS.has(key))
    if (unmatched.length > 0) setNotice(unmatched.map(([, reason]) => reason).join("；"))
    else if (!hasLobbyErrors(split)) setNotice("內容不符合規則，請檢查後再試。")
  }

  const latestValues = (d: LobbyDetail) =>
    lobbyConflictValues({
      namePrefix: d.name_prefix,
      managerRoleNames: d.manager_role_ids.map(roleName),
      onePerUser: d.one_per_user,
      maxOpen: d.max_open,
      message: d.content,
      buttonLabel: d.button_label,
    })
  const mineValues = lobbyConflictValues({
    namePrefix,
    managerRoleNames: managerRoleIds.map(roleName),
    onePerUser,
    maxOpen: parseMaxOpen(maxOpen) ?? null,
    message,
    buttonLabel: buttonLabel.trim() || null,
  })

  const title = isCreate ? "新增私人頻道大廳" : "編輯私人頻道大廳"

  if (result) {
    return (
      <section className="space-y-4 rounded-md border border-primary/20 dark:border-champagne/25 p-4" aria-label={title}>
        <h3 ref={headingRef} tabIndex={-1} className="font-serif text-lg text-primary dark:text-silver outline-none">
          大廳設定已儲存，但有私人頻道沒套用成功
        </h3>
        <p className="text-sm">
          以下頻道沒能套用管理身分組的變更。請確認我在這些頻道（或所在分類）有 Manage Roles 與 Manage Channels 權限後，回來重新儲存一次。
        </p>
        <ul className="space-y-1 text-sm">
          {result.failures.map((f) => (
            <li key={f.channel_id}>
              <a
                className="underline break-all"
                href={`https://discord.com/channels/${guildId}/${f.channel_id}`}
                target="_blank"
                rel="noreferrer"
              >
                頻道 {f.channel_id}
              </a>
              ：{f.reason}
            </li>
          ))}
        </ul>
        <Button type="button" onClick={onClose}>
          關閉
        </Button>
      </section>
    )
  }

  return (
    <form
      className="space-y-5 rounded-md border border-primary/20 dark:border-champagne/25 p-4"
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
      {loadError && <p className="text-sm text-red-700 dark:text-red-300">無法載入這個大廳，請關閉後重試。</p>}
      {!ready && !loadError && <p className={muted}>載入中…</p>}

      {ready && (
        <>
          {channelInvalid && (
            <p role="status" className="rounded-md border border-amber-600/50 dark:border-amber-400/50 px-3 py-2 text-sm">
              原本的大廳頻道已被刪除。請重新選擇（或讓星羽新建）大廳頻道，儲存後會在新的頻道重新發出大廳訊息，底下的私人頻道與流水號會一起搬過去。
            </p>
          )}
          {messageInvalid && (
            <p role="status" className="rounded-md border border-amber-600/50 dark:border-amber-400/50 px-3 py-2 text-sm">
              大廳訊息已被刪除。儲存後會在原本的大廳頻道重新發出大廳訊息。
            </p>
          )}

          {needsChannel ? (
            <fieldset className="space-y-3">
              <legend className="mb-1 font-medium">大廳頻道</legend>
              <div>
                {(
                  [
                    ["existing", "使用既有的文字頻道"],
                    ["new", "讓星羽新建一個頻道"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="mr-4 inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`${uid}-kind`}
                      value={value}
                      checked={channelKind === value}
                      disabled={busy}
                      onChange={() => setChannelKind(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {channelKind === "existing" ? (
                <div>
                  <label htmlFor={`${uid}-channel`} className={labelClass}>
                    大廳頻道（必填）
                  </label>
                  <Select
                    id={`${uid}-channel`}
                    value={channelId ?? ""}
                    disabled={busy || options === null}
                    aria-invalid={!!fieldError("lobby_channel")}
                    onChange={(e) => {
                      setChannelId(e.target.value || null)
                      clear("lobby_channel")
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
                  {fieldError("lobby_channel") && <Problem>{fieldError("lobby_channel")}</Problem>}
                  {selectedChannel && <Issues issues={selectedChannel.permission_issues} />}
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor={`${uid}-new-name`} className={labelClass}>
                      新頻道名稱（必填）
                    </label>
                    <Input
                      id={`${uid}-new-name`}
                      value={newName}
                      disabled={busy}
                      onChange={(e) => {
                        setNewName(e.target.value)
                        clear("lobby_channel.name")
                      }}
                    />
                    {fieldError("lobby_channel.name") && <Problem>{fieldError("lobby_channel.name")}</Problem>}
                  </div>
                  <div>
                    <label htmlFor={`${uid}-new-category`} className={labelClass}>
                      新頻道所在的分類（必填）
                    </label>
                    <Select
                      id={`${uid}-new-category`}
                      value={newCategoryId ?? ""}
                      disabled={busy || options === null}
                      onChange={(e) => {
                        setNewCategoryId(e.target.value || null)
                        clear("lobby_channel.category_id")
                      }}
                    >
                      <option value="">選擇分類</option>
                      {options?.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    {fieldError("lobby_channel.category_id") && <Problem>{fieldError("lobby_channel.category_id")}</Problem>}
                    {newCategory && <Issues issues={newCategory.permission_issues.filter((i) => i.permission === "Manage Channels")} />}
                  </div>
                </>
              )}
            </fieldset>
          ) : (
            <div className="text-sm">
              大廳頻道：
              <span className="font-medium">
                {lobbyId && options?.channels.find((c) => c.id === lobbyId)
                  ? `#${options.channels.find((c) => c.id === lobbyId)?.name}`
                  : "（讀取中）"}
              </span>
              <span className={`block ${muted}`}>大廳頻道還在時不能更換；要換頻道請移除這個大廳後重新新增。</span>
              {fieldError("lobby_channel") && <Problem>{fieldError("lobby_channel")}</Problem>}
              <Issues issues={options?.channels.find((c) => c.id === lobbyId)?.permission_issues ?? []} />
            </div>
          )}

          <div>
            <label htmlFor={`${uid}-category`} className={labelClass}>
              私人頻道所在的分類（必填）
            </label>
            <Select
              id={`${uid}-category`}
              value={categoryValue ?? ""}
              disabled={busy || options === null}
              aria-invalid={!!fieldError("ticket_category_id")}
              onChange={(e) => {
                setTicketCategoryId(e.target.value || null)
                clear("ticket_category_id")
              }}
            >
              {options === null ? (
                <option value="">載入中…</option>
              ) : (
                <>
                  <option value="">選擇分類</option>
                  {options.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </>
              )}
            </Select>
            {ticketCategoryId !== null && categoryValue === null && options !== null && (
              <Problem>原本的分類已被刪除，請重新選擇。</Problem>
            )}
            {fieldError("ticket_category_id") && <Problem>{fieldError("ticket_category_id")}</Problem>}
            {selectedCategory && <Issues issues={selectedCategory.permission_issues} />}
          </div>

          <div>
            <RoleMultiSelect
              legend="管理身分組"
              options={options?.roles ?? null}
              value={managerRoleIds}
              disabled={busy}
              describedBy={fieldError("manager_role_ids") ? `${uid}-roles-error` : undefined}
              onChange={(ids) => {
                setManagerRoleIds(ids)
                clear("manager_role_ids")
              }}
            />
            <p className={`mt-1 text-sm ${muted}`}>
              管理身分組看得到這個大廳所有的私人頻道，也能鎖定、重開、刪除。修改後會套用到所有還沒刪除的私人頻道：新增的立刻看得到，已鎖定的要重開後才能發言；移除的覆寫直接刪除。
            </p>
            {fieldError("manager_role_ids") && <Problem id={`${uid}-roles-error`}>{fieldError("manager_role_ids")}</Problem>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-prefix`} className={labelClass}>
                頻道名稱前綴
              </label>
              <Input
                id={`${uid}-prefix`}
                value={namePrefix}
                disabled={busy}
                aria-invalid={!!fieldError("name_prefix")}
                onChange={(e) => {
                  setNamePrefix(e.target.value)
                  clear("name_prefix")
                }}
              />
              <p className={`mt-1 text-sm ${muted}`}>
                {prefixExample(namePrefix) ? `私人頻道會叫「${prefixExample(namePrefix)}」。` : ""}
                處理後須為 1 到 {MAX_PREFIX} 個字元，不同大廳可以用相同的前綴。
              </p>
              {fieldError("name_prefix") && <Problem>{fieldError("name_prefix")}</Problem>}
            </div>
            <div>
              <label htmlFor={`${uid}-max`} className={labelClass}>
                整個大廳的同時開啟上限
              </label>
              <Input
                id={`${uid}-max`}
                inputMode="numeric"
                value={maxOpen}
                disabled={busy}
                aria-invalid={!!fieldError("max_open")}
                onChange={(e) => {
                  setMaxOpen(e.target.value)
                  clear("max_open")
                }}
              />
              <p className={`mt-1 text-sm ${muted}`}>
                所有成員合計，這個大廳同時存在的私人頻道最多幾個，達到後任何人都不能再開單；已鎖定、還沒刪除的也算在內。留空表示不限。
              </p>
              {fieldError("max_open") && <Problem>{fieldError("max_open")}</Problem>}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={onePerUser} disabled={busy} onChange={(e) => setOnePerUser(e.target.checked)} />
                每人限開一張
              </label>
              <p className={`mt-1 text-sm ${muted}`}>
                勾選時，每位成員在這個大廳同時只能有一張私人頻道；不勾選則每人不限張數，只受上面的整體上限限制。
              </p>
            </div>
          </div>

          <section aria-labelledby={`${uid}-message-heading`}>
            <h4 id={`${uid}-message-heading`} className="mb-2 font-medium">
              大廳訊息
            </h4>
            <MessageEditor
              value={message}
              onChange={(next) => {
                setMessage(next)
                setErrors((e) => ({ ...e, message: [] }))
              }}
              errors={errors.message}
              buttons={lobbyPreviewButtons(buttonLabel, buttonEmoji)}
            />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-label`} className={labelClass}>
                開單按鈕文字（預設「{DEFAULT_BUTTON_LABEL}」）
              </label>
              <Input
                id={`${uid}-label`}
                value={buttonLabel}
                maxLength={MAX_BUTTON_LABEL * 2}
                disabled={busy}
                aria-invalid={!!fieldError("button_label")}
                onChange={(e) => {
                  setButtonLabel(e.target.value)
                  clear("button_label")
                }}
              />
              {fieldError("button_label") && <Problem>{fieldError("button_label")}</Problem>}
            </div>
            <div>
              <label htmlFor={`${uid}-emoji`} className={labelClass}>
                開單按鈕 emoji
              </label>
              <Select
                id={`${uid}-emoji`}
                value={buttonEmoji ?? ""}
                disabled={busy || options === null}
                aria-invalid={!!fieldError("button_emoji")}
                onChange={(e) => {
                  setButtonEmoji(e.target.value || null)
                  clear("button_emoji")
                }}
              >
                <option value="">不使用 emoji</option>
                {buttonEmoji &&
                  !UNICODE_EMOJIS.includes(buttonEmoji) &&
                  !options?.emojis.some((x) => x.value === buttonEmoji) && (
                    <option value={buttonEmoji}>{emojiText(buttonEmoji)}（目前設定）</option>
                  )}
                <optgroup label="Unicode">
                  {UNICODE_EMOJIS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </optgroup>
                {options && options.emojis.length > 0 && (
                  <optgroup label="本伺服器的自訂 emoji">
                    {options.emojis.map((x) => (
                      <option key={x.id} value={x.value}>
                        :{x.name}:
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
              {fieldError("button_emoji") && <Problem>{fieldError("button_emoji")}</Problem>}
            </div>
          </div>
        </>
      )}

      {conflict && (
        <ConflictNotice
          subject="這個大廳"
          current={conflict.latest ? latestValues(conflict.latest) : null}
          mine={mineValues}
          busy={busy}
          onOverwrite={() => {
            const latest = conflict.latest
            if (!latest) return
            setOriginal(latest.original)
            void submit(latest.original)
          }}
          onRecreate={() => {
            // 大廳已被移除：在原頻道重新新增
            const old = lobbyId
            setLobbyId(null)
            setChannelKind("existing")
            setChannelId(old)
            void submit(null, true, old)
          }}
        />
      )}
      {notice && <Problem>{notice}</Problem>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || !ready}>
          {isCreate ? "新增大廳" : "儲存"}
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
      </div>
    </form>
  )
}
