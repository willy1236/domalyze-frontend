"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Textarea } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  type ChannelNotifyType,
  type ChannelNotifyValues,
  deleteChannelNotify,
  parseSaveProblem,
  saveChannelNotify,
} from "@/lib/dashboard-channel-notifies"
import { registerDraft } from "@/lib/dashboard-draft"
import { useNotifyOptions } from "@/lib/dashboard-options"
import { useNotifyPreview } from "@/lib/dashboard-preview"
import { ChannelSelect } from "./channel-select"
import { ConflictNotice } from "./conflict-notice"
import { WarnIcon } from "./icons"
import { NotifyPreview } from "./notify-preview"
import { RoleSelect } from "./role-select"

/** 表單暫存的內容：還原時回到同一種類、同一份原始值與使用者已輸入的內容 */
export interface ChannelFormDraft {
  typeKey: string
  original: ChannelNotifyValues | null
  channelId: string | null
  roleId: string | null
  message: string
}

/** 所有頻道通知表單共用同一個暫存鍵：同時只會開一個表單 */
export const CHANNEL_DRAFT_KEY = "channel-notify"

interface Props {
  guildId: string
  type: ChannelNotifyType
  /** 打開時該筆的值；null 表示新增 */
  original: ChannelNotifyValues | null
  /** 還原暫存時帶入使用者已輸入的內容 */
  restored?: Pick<ChannelFormDraft, "channelId" | "roleId" | "message">
  onClose: () => void
  /** 新增、修改或刪除成功（含發現已不存在）後呼叫，讓一覽重新載入 */
  onChanged: () => void
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

export function ChannelNotifyForm({ guildId, type, original, restored, onClose, onChanged }: Props) {
  const initial = original ?? {}
  const [base, setBase] = useState<ChannelNotifyValues | null>(original)
  const [channelId, setChannelId] = useState<string | null>(restored ? restored.channelId : (initial.channel_id ?? null))
  const [roleId, setRoleId] = useState<string | null>(restored ? restored.roleId : (initial.role_id ?? null))
  const [message, setMessage] = useState<string>(restored ? restored.message : (initial.message ?? ""))
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: ChannelNotifyValues | null; mine: ChannelNotifyValues } | null>(null)

  const { options, error: optionsError } = useNotifyOptions(guildId, type.key)
  const { preview, error: previewError } = useNotifyPreview(
    guildId,
    type.key,
    type.hasRole ? roleId : null,
    type.hasMessage && message ? message : null,
  )

  const stateRef = useRef<ChannelFormDraft>({ typeKey: type.key, original: base, channelId, roleId, message })
  stateRef.current = { typeKey: type.key, original: base, channelId, roleId, message }
  useEffect(() => registerDraft(CHANNEL_DRAFT_KEY, base === null ? "create" : "edit", () => stateRef.current), [base])

  const currentValues = (): ChannelNotifyValues => {
    const v: ChannelNotifyValues = { channel_id: channelId }
    if (type.hasRole) v.role_id = roleId
    if (type.hasMessage) v.message = message || null
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

  function reset() {
    setBusy(true)
    setFieldErrors({})
    setNotice(null)
    setConflict(null)
  }

  async function submit(against: ChannelNotifyValues | null) {
    reset()
    const mine = currentValues()
    try {
      await saveChannelNotify(guildId, type.key, mine, against)
      onChanged()
      onClose()
    } catch (e) {
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict" || problem?.kind === "already_exists") {
        setConflict({ current: problem.current, mine })
      } else if (problem?.kind === "invalid_field") {
        setFieldErrors({ [problem.field]: problem.reason })
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save channel notify failed", e)
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!base) return
    if (!window.confirm(`確定要刪除「${type.name}」嗎？刪除後 bot 不會再發送這個通知。`)) return
    reset()
    try {
      await deleteChannelNotify(guildId, type.key, base)
      onChanged()
      onClose()
    } catch (e) {
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict" && problem.current === null) {
        // 已被別人刪除：目的已達成，重新載入一覽
        onChanged()
        onClose()
      } else if (problem?.kind === "conflict" && problem.current) {
        // 已被修改：表單換成最新內容，請使用者確認後再決定
        setBase(problem.current)
        setChannelId(problem.current.channel_id ?? null)
        setRoleId(problem.current.role_id ?? null)
        setMessage(problem.current.message ?? "")
        setNotice("這筆通知已在你編輯期間被別人修改，表單已更新成最新內容，請確認後再決定是否刪除。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete channel notify failed", e)
        setNotice("刪除失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="mt-4 space-y-5 rounded-md border border-primary/20 dark:border-champagne/25 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit(base)
      }}
    >
      <h3 className="font-serif text-lg text-primary dark:text-silver">
        {base === null ? "新增" : "編輯"}：{type.name}
      </h3>

      {type.scheduled && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          這是定時通知，bot 會持續編輯同一則訊息。請讓 bot 的訊息保持在該頻道的最新位置，否則 bot 找不到訊息會重複發送。
        </p>
      )}
      {optionsError && <p className="text-sm text-red-700 dark:text-red-300">無法載入頻道與身分組選項，請重新整理。</p>}

      <div>
        <label htmlFor="notify-channel" className={labelClass}>
          頻道（必填）
        </label>
        <ChannelSelect id="notify-channel" options={options?.channels ?? null} value={channelId} onChange={setChannelId} disabled={busy} />
        <FieldError reason={fieldErrors.channel_id} />
      </div>

      {type.hasRole && (
        <div>
          <label htmlFor="notify-role" className={labelClass}>
            要 tag 的身分組
          </label>
          <RoleSelect id="notify-role" options={options?.roles ?? null} value={roleId} onChange={setRoleId} disabled={busy} />
          <FieldError reason={fieldErrors.role_id} />
        </div>
      )}

      {type.hasMessage && (
        <div>
          <label htmlFor="notify-message" className={labelClass}>
            自訂文字（留空使用預設文字，可用 {"{member}"} 代表成員）
          </label>
          <Textarea
            id="notify-message"
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

      {conflict && (
        <ConflictNotice
          current={conflict.current}
          mine={conflict.mine}
          format={format}
          busy={busy}
          onOverwrite={(latest) => {
            setBase(latest)
            void submit(latest)
          }}
          onRecreate={() => {
            setBase(null)
            void submit(null)
          }}
        />
      )}
      {notice && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{notice}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || channelId === null}>
          儲存
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
        {base !== null && (
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
