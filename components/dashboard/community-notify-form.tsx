"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Input, Select, Textarea } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import type { ChannelNotifyValues } from "@/lib/dashboard-channel-notifies"
import {
  COMMUNITY_NOTIFY_TYPES,
  PLATFORM_HINTS,
  PLATFORM_LABELS,
  RESOLVE_FAILURE_TEXT,
  createCommunityNotifies,
  deleteCommunityNotify,
  parseCommunityProblem,
  resolveAccount,
  typesOf,
  updateCommunityNotify,
  type CommunityNotifyType,
  type CommunityPlatform,
  type ResolveFailure,
  type ResolvedAccount,
  type SaveResult,
} from "@/lib/dashboard-community-notifies"
import { registerDraft } from "@/lib/dashboard-draft"
import { useNotifyOptions } from "@/lib/dashboard-options"
import { useNotifyPreview } from "@/lib/dashboard-preview"
import type { NotifyItem } from "@/lib/dashboard-notifies"
import { ChannelSelect } from "./channel-select"
import { ConflictNotice } from "./conflict-notice"
import { WarnIcon } from "./icons"
import { NotifyPreview } from "./notify-preview"
import { RoleSelect } from "./role-select"

/** 表單暫存的內容：新增流程停在哪一步、查到的帳號、勾選的種類與已輸入的欄位 */
export interface CommunityFormDraft {
  platform: CommunityPlatform
  input: string
  account: ResolvedAccount | null
  checked: string[]
  /** 正在編輯的那一筆的種類鍵；新增流程為 null */
  editKey: string | null
  base: ChannelNotifyValues | null
  channelId: string | null
  roleId: string | null
  message: string
}

export const COMMUNITY_DRAFT_KEY = "community-notify"

interface Props {
  guildId: string
  /** 一覽上的全部社群推播，用來判斷帳號已設定過哪些種類 */
  items: NotifyItem[]
  initial: CommunityFormDraft
  onClose: () => void
  /** 新增、修改或刪除成功（含發現已不存在）後呼叫，讓一覽重新載入 */
  onChanged: () => void
}

/** 新增流程的初始狀態 */
export function newCommunityDraft(platform: CommunityPlatform = "twitch"): CommunityFormDraft {
  return { platform, input: "", account: null, checked: [], editKey: null, base: null, channelId: null, roleId: null, message: "" }
}

/** 從一覽的一筆推播開啟編輯 */
export function editCommunityDraft(item: NotifyItem): CommunityFormDraft {
  const type = COMMUNITY_NOTIFY_TYPES.find((t) => t.key === item.key)!
  const account = item.account!
  return {
    platform: type.platform,
    input: "",
    account: { platform: type.platform, account_id: account.id, display_name: account.display_name, username: account.username },
    checked: [],
    editKey: item.key,
    base: item.values,
    channelId: item.values.channel_id ?? null,
    roleId: item.values.role_id ?? null,
    message: item.values.message ?? "",
  }
}

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"

function FieldError({ reason }: { reason?: string }) {
  if (!reason) return null
  return (
    <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{reason}</span>
    </p>
  )
}

const typeOf = (key: string): CommunityNotifyType => COMMUNITY_NOTIFY_TYPES.find((t) => t.key === key)!

export function CommunityNotifyForm({ guildId, items, initial, onClose, onChanged }: Props) {
  const [platform, setPlatform] = useState(initial.platform)
  const [input, setInput] = useState(initial.input)
  const [account, setAccount] = useState<ResolvedAccount | null>(initial.account)
  const [checked, setChecked] = useState<string[]>(initial.checked)
  const [editKey, setEditKey] = useState<string | null>(initial.editKey)
  const [base, setBase] = useState<ChannelNotifyValues | null>(initial.base)
  const [channelId, setChannelId] = useState<string | null>(initial.channelId)
  const [roleId, setRoleId] = useState<string | null>(initial.roleId)
  const [message, setMessage] = useState(initial.message)

  const [busy, setBusy] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [existing, setExisting] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: ChannelNotifyValues | null; mine: ChannelNotifyValues; key: string } | null>(null)

  const activeTypes = editKey ? [typeOf(editKey)] : checked.map(typeOf)
  const hasMessage = activeTypes.length > 0 && activeTypes.every((t) => t.hasMessage)
  const optionsKey = (activeTypes[0] ?? typesOf(platform)[0]).key
  const { options, error: optionsError } = useNotifyOptions(guildId, optionsKey)
  const { preview, error: previewError } = useNotifyPreview(guildId, optionsKey, roleId, hasMessage && message ? message : null)

  const stateRef = useRef<CommunityFormDraft>(initial)
  // 暫存只在工作階段過期時讀取，render 之後再同步即可
  useEffect(() => {
    stateRef.current = { platform, input, account, checked, editKey, base, channelId, roleId, message }
  })
  const mode = editKey ? "edit" : "create"
  useEffect(() => registerDraft(COMMUNITY_DRAFT_KEY, mode, () => stateRef.current), [mode])

  const accountItems = (acc: ResolvedAccount) => items.filter((i) => i.account?.id === acc.account_id && typeOf(i.key).platform === acc.platform)
  const configuredKeys = account ? accountItems(account).map((i) => i.key) : []

  const accountLabel = account
    ? account.display_name && account.display_name !== account.username
      ? `${account.display_name}（${account.username}）`
      : account.username
    : ""

  const currentValues = (withMessage: boolean): ChannelNotifyValues => {
    const v: ChannelNotifyValues = { channel_id: channelId, role_id: roleId }
    if (withMessage) v.message = message || null
    return v
  }

  const format = (field: string, value: string | null) => {
    if (value === null || value === "") return "無"
    if (field === "channel_id") {
      const c = options?.channels.find((o) => o.id === value)
      return c ? `# ${c.name}` : value
    }
    if (field === "role_id") {
      const r = options?.roles.find((o) => o.id === value)
      return r ? `@ ${r.name}` : value
    }
    return value
  }

  function begin() {
    setBusy(true)
    setFieldErrors({})
    setNotice(null)
    setConflict(null)
    setExisting([])
  }

  function afterSave(result: SaveResult) {
    if (result.push === "failed") {
      window.alert("推播設定已存入，但目前無法向 YouTube 訂閱推播。請稍後重新編輯並存檔一次。")
    }
    onChanged()
    onClose()
  }

  async function lookup() {
    setResolving(true)
    setResolveError(null)
    setAccount(null)
    setChecked([])
    try {
      const found = await resolveAccount(guildId, platform, input)
      const configured = items.filter((i) => i.account?.id === found.account_id && typeOf(i.key).platform === platform)
      const single = typesOf(platform).length === 1
      if (single) {
        // YouTube、Twitter 的帳號已設定過，改成打開那一筆的編輯
        const mine = configured[0]
        if (mine) {
          const draft = editCommunityDraft(mine)
          setAccount(draft.account)
          setEditKey(draft.editKey)
          setBase(draft.base)
          setChannelId(draft.channelId)
          setRoleId(draft.roleId)
          setMessage(draft.message)
          return
        }
        setChecked([typesOf(platform)[0].key])
      } else {
        const free = typesOf(platform).find((t) => !configured.some((i) => i.key === t.key))
        setChecked(free ? [free.key] : [])
      }
      setAccount(found)
    } catch (e) {
      const problem = parseCommunityProblem(e)
      if (problem?.kind === "resolve_failed") setResolveError(RESOLVE_FAILURE_TEXT[problem.reason as ResolveFailure])
      else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("resolve account failed", e)
        setResolveError("查詢失敗，請稍後再試。")
      }
    } finally {
      setResolving(false)
    }
  }

  /** against 有值是修改；否則新增 createKeys（預設為勾選的種類） */
  async function save(against: { key: string; original: ChannelNotifyValues } | null, createKeys: string[] = checked) {
    if (!account) return
    begin()
    const createTypes = createKeys.map(typeOf)
    const withMessage = against ? typeOf(against.key).hasMessage : createTypes.length > 0 && createTypes.every((t) => t.hasMessage)
    const mine = currentValues(withMessage)
    try {
      const result = against
        ? await updateCommunityNotify(guildId, against.key, account.account_id, mine, against.original)
        : await createCommunityNotifies(guildId, platform, account.account_id, createKeys, mine)
      afterSave(result)
    } catch (e) {
      const problem = parseCommunityProblem(e)
      if (problem?.kind === "conflict" && against) {
        setConflict({ current: problem.current, mine, key: against.key })
      } else if (problem?.kind === "already_exists") {
        const only = createKeys.length === 1 ? createKeys[0] : null
        if (only && problem.current[only]) {
          // 只勾了一種：比照頻道通知顯示衝突提示，覆蓋時改走修改
          setConflict({ current: problem.current[only], mine, key: only })
        } else {
          setExisting(problem.existing)
          setNotice("勾選的種類中有已經設定過的，請取消勾選後再存檔，或到下方一覽編輯那一筆。")
        }
      } else if (problem?.kind === "invalid_field") {
        setFieldErrors({ [problem.field]: problem.reason })
      } else if (problem?.kind === "resolve_failed") {
        setNotice(RESOLVE_FAILURE_TEXT[problem.reason as ResolveFailure])
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save community notify failed", e)
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!account || !editKey || !base) return
    if (!window.confirm(`確定要刪除「${typeOf(editKey).name}」對「${accountLabel}」的推播嗎？`)) return
    begin()
    try {
      await deleteCommunityNotify(guildId, editKey, account.account_id, base)
      onChanged()
      onClose()
    } catch (e) {
      const problem = parseCommunityProblem(e)
      if (problem?.kind === "conflict" && problem.current === null) {
        onChanged()
        onClose()
      } else if (problem?.kind === "conflict" && problem.current) {
        setBase(problem.current)
        setChannelId(problem.current.channel_id ?? null)
        setRoleId(problem.current.role_id ?? null)
        setMessage(problem.current.message ?? "")
        setNotice("這筆推播已在你編輯期間被別人修改，表單已更新成最新內容，請確認後再決定是否刪除。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete community notify failed", e)
        setNotice("刪除失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  const platformTypes = typesOf(platform)
  const canSave = account !== null && channelId !== null && (editKey !== null || checked.length > 0)

  return (
    <form
      className="mt-4 space-y-5 rounded-md border border-primary/20 dark:border-champagne/25 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void save(editKey && base ? { key: editKey, original: base } : null)
      }}
    >
      <h3 className="font-serif text-lg text-primary dark:text-silver break-words">
        {editKey ? `編輯：${typeOf(editKey).name}` : "新增社群推播"}
        {editKey && account && <span className="block text-base text-gray-600 dark:text-gray-400">{accountLabel}</span>}
      </h3>

      {!editKey && (
        <div className="space-y-3">
          <div>
            <label htmlFor="community-platform" className={labelClass}>
              平台
            </label>
            <Select
              id="community-platform"
              value={platform}
              disabled={busy || resolving}
              onChange={(e) => {
                setPlatform(e.target.value as CommunityPlatform)
                setAccount(null)
                setChecked([])
                setResolveError(null)
              }}
            >
              {(Object.keys(PLATFORM_LABELS) as CommunityPlatform[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="community-input" className={labelClass}>
              帳號名稱或網址
            </label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="community-input"
                type="text"
                value={input}
                placeholder={PLATFORM_HINTS[platform]}
                disabled={busy || resolving}
                onChange={(e) => {
                  setInput(e.target.value)
                  setAccount(null)
                  setResolveError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (input.trim()) void lookup()
                  }
                }}
                className="flex-1 basis-56"
              />
              <Button type="button" disabled={busy || resolving || !input.trim()} onClick={() => void lookup()}>
                {resolving ? "查詢中…" : "查詢"}
              </Button>
            </div>
            <FieldError reason={resolveError ?? undefined} />
            {account && (
              <p className="mt-2 text-sm">
                找到帳號：<span className="font-semibold break-all">{accountLabel}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {account && !editKey && platformTypes.length > 1 && (
        <fieldset>
          <legend className={labelClass}>推播種類（可複選）</legend>
          <div className="space-y-1">
            {platformTypes.map((t) => {
              const isConfigured = configuredKeys.includes(t.key)
              return (
                <label key={t.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked.includes(t.key)}
                    disabled={busy}
                    onChange={(e) => setChecked((prev) => (e.target.checked ? [...prev, t.key] : prev.filter((k) => k !== t.key)))}
                  />
                  {t.name}
                  {(isConfigured || existing.includes(t.key)) && (
                    <span className="text-red-700 dark:text-red-300">（已設定）</span>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {account && (
        <>
          {optionsError && <p className="text-sm text-red-700 dark:text-red-300">無法載入頻道與身分組選項，請重新整理。</p>}

          <div>
            <label htmlFor="community-channel" className={labelClass}>
              頻道（必填）
            </label>
            <ChannelSelect id="community-channel" options={options?.channels ?? null} value={channelId} onChange={setChannelId} disabled={busy} />
            <FieldError reason={fieldErrors.channel_id} />
          </div>

          <div>
            <label htmlFor="community-role" className={labelClass}>
              要 tag 的身分組
            </label>
            <RoleSelect id="community-role" options={options?.roles ?? null} value={roleId} onChange={setRoleId} disabled={busy} />
            <FieldError reason={fieldErrors.role_id} />
          </div>

          {hasMessage && (
            <div>
              <label htmlFor="community-message" className={labelClass}>
                自訂文字（留空使用預設文字）
              </label>
              <Textarea
                id="community-message"
                rows={3}
                maxLength={2000}
                value={message}
                disabled={busy}
                onChange={(e) => setMessage(e.target.value)}
              />
              <FieldError reason={fieldErrors.message} />
            </div>
          )}

          <div>
            <p className={labelClass}>預覽</p>
            <NotifyPreview preview={preview} error={previewError} />
          </div>
        </>
      )}

      {conflict && (
        <ConflictNotice
          current={conflict.current}
          mine={conflict.mine}
          format={format}
          busy={busy}
          onOverwrite={(latest) => {
            // 改走修改：以最新的值當原始值
            setEditKey(conflict.key)
            setBase(latest)
            void save({ key: conflict.key, original: latest })
          }}
          onRecreate={() => {
            // 對方刪掉這筆：以這一種重新新增，錯誤處理與一般新增相同
            setEditKey(null)
            setBase(null)
            setChecked([conflict.key])
            void save(null, [conflict.key])
          }}
        />
      )}
      {notice && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{notice}</span>
        </p>
      )}
      {busy && platform === "youtube" && account && (
        <p className="text-sm text-gray-600 dark:text-gray-400">處理中，向 YouTube 訂閱推播最久可能需要約一分鐘…</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || !canSave}>
          {busy ? "處理中…" : "儲存"}
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
        {editKey && base !== null && (
          <Button
            variant="danger"
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="ml-auto"
          >
            刪除
          </Button>
        )}
      </div>
    </form>
  )
}
