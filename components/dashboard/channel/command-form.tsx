"use client"

import { useState } from "react"
import { Button, Input, Select, Textarea } from "@/components/ui"
import { LabelWithCount } from "@/components/dashboard/char-count"
import { ConflictNotice } from "@/components/dashboard/conflict-notice"
import { WarnIcon } from "@/components/dashboard/icons"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  ALIASES_MAX,
  aliasesToInput,
  type ChannelCommand,
  type CommandPermission,
  type CommandValues,
  COMMAND_VARIABLES,
  COOLDOWN_MAX,
  createCommand,
  deleteCommand,
  EMPTY_COMMAND,
  formatConflictField,
  fromConflictValues,
  NAME_MAX,
  normalizeName,
  parseAliasInput,
  parseSaveProblem,
  PERMISSIONS,
  RESPONSE_MAX,
  saveCommand,
  toConflictValues,
  valuesOf,
} from "@/lib/dashboard-channel-commands"
import { charLength } from "@/lib/dashboard-message"
import { useChannelError } from "./channel-access-guard"

interface Props {
  channelId: string
  /** 編輯中的指令；null 表示新增 */
  original: ChannelCommand | null
  onClose: () => void
  /** 新增、修改或刪除成功（含發現已不存在）後呼叫，讓清單重新載入 */
  onChanged: () => void
  /** 收到 channel_not_enabled：頻道的啟用狀態已經變了，重新載入頻道資料 */
  onNotEnabled: () => void
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

/** 回應欄下方的變數說明。 */
export function CommandVariables() {
  return (
    <details className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      <summary className="cursor-pointer">可用的變數</summary>
      <ul className="mt-2 space-y-1">
        {COMMAND_VARIABLES.map((v) => (
          <li key={v.token}>
            <code className="font-mono text-primary dark:text-silver">{v.token}</code>：{v.description}
          </li>
        ))}
      </ul>
      <p className="mt-2">不認得的變數會原樣送出。含 {"{touser}"} 或 {"{args}"} 的回應，星羽發言前會再檢查一次頻道的 AutoMod。</p>
    </details>
  )
}

function toNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text)
}

export function CommandForm({ channelId, original, onClose, onChanged, onNotEnabled }: Props) {
  const initial = original ? valuesOf(original) : EMPTY_COMMAND
  const [base, setBase] = useState<CommandValues | null>(original ? valuesOf(original) : null)
  const [name, setName] = useState(initial.name)
  const [response, setResponse] = useState(initial.response)
  const [aliasText, setAliasText] = useState(aliasesToInput(initial.aliases))
  const [enabled, setEnabled] = useState(initial.enabled)
  const [globalCooldown, setGlobalCooldown] = useState(String(initial.global_cooldown))
  const [userCooldown, setUserCooldown] = useState(String(initial.user_cooldown))
  const [permission, setPermission] = useState<CommandPermission>(initial.permission)
  const leaveIfUnlinked = useChannelError()
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: Record<string, string | null> | null; mine: CommandValues } | null>(null)

  const apply = (values: CommandValues) => {
    setName(values.name)
    setResponse(values.response)
    setAliasText(aliasesToInput(values.aliases))
    setEnabled(values.enabled)
    setGlobalCooldown(String(values.global_cooldown))
    setUserCooldown(String(values.user_cooldown))
    setPermission(values.permission)
  }

  const currentValues = (): CommandValues => ({
    name: normalizeName(name),
    response,
    aliases: parseAliasInput(aliasText),
    enabled,
    global_cooldown: toNumber(globalCooldown),
    user_cooldown: toNumber(userCooldown),
    permission,
  })

  /** 送出前擋下明顯的錯誤，回傳欄位對應的提示（空物件表示通過）；其餘規則由後端判斷。 */
  const localProblems = (v: CommandValues): Record<string, string> => {
    const problems: Record<string, string> = {}
    if (!v.name) problems.name = "請輸入指令名稱"
    if (!v.response.trim()) problems.response = "請輸入回應內容"
    if (!Number.isInteger(v.global_cooldown) || v.global_cooldown < 0 || v.global_cooldown > COOLDOWN_MAX) {
      problems.global_cooldown = `請輸入 0 到 ${COOLDOWN_MAX} 的整數`
    }
    if (!Number.isInteger(v.user_cooldown) || v.user_cooldown < 0 || v.user_cooldown > COOLDOWN_MAX) {
      problems.user_cooldown = `請輸入 0 到 ${COOLDOWN_MAX} 的整數`
    }
    return problems
  }

  function reset() {
    setBusy(true)
    setFieldErrors({})
    setNotice(null)
    setConflict(null)
  }

  async function submit(against: CommandValues | null) {
    const mine = currentValues()
    const problems = localProblems(mine)
    if (Object.keys(problems).length > 0) {
      setFieldErrors(problems)
      return
    }
    reset()
    try {
      if (against === null) await createCommand(channelId, mine)
      else await saveCommand(channelId, against.name, mine, against)
      onChanged()
      onClose()
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict") {
        setConflict({ current: problem.current, mine })
      } else if (problem?.kind === "invalid_field") {
        setFieldErrors({ [problem.field]: problem.reason })
      } else if (problem?.kind === "automod_blocked") {
        setFieldErrors({ response: "這段回應會被頻道的 AutoMod 擋下，請修改內容。" })
      } else if (problem?.kind === "automod_unavailable") {
        setNotice("目前無法檢查 AutoMod，請稍後再試。")
      } else if (problem?.kind === "not_enabled") {
        onNotEnabled()
        onClose()
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save command failed", e)
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!base) return
    if (!window.confirm(`確定要刪除指令 !${base.name} 嗎？刪除後觀眾就不能再觸發它。`)) return
    reset()
    try {
      await deleteCommand(channelId, base.name, base)
      onChanged()
      onClose()
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "conflict" && problem.current === null) {
        // 已被別人刪除：目的已達成，重新載入清單
        onChanged()
        onClose()
      } else if (problem?.kind === "conflict" && problem.current) {
        // 已被修改：表單換成最新內容，請使用者確認後再決定
        const latest = fromConflictValues(problem.current)
        setBase(latest)
        apply(latest)
        setNotice("這個指令已在你編輯期間被修改，表單已更新成最新內容，請確認後再決定是否刪除。")
      } else if (problem?.kind === "not_enabled") {
        onNotEnabled()
        onClose()
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete command failed", e)
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
      <h3 className="font-serif text-lg text-primary dark:text-silver">{base === null ? "新增指令" : `編輯指令：!${base.name}`}</h3>

      <div>
        <label htmlFor="command-name" className={labelClass}>
          <LabelWithCount used={charLength(normalizeName(name))} max={NAME_MAX}>
            指令名稱（觀眾在聊天室輸入 !名稱 觸發）
          </LabelWithCount>
        </label>
        <Input id="command-name" value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
        <FieldError reason={fieldErrors.name} />
      </div>

      <div>
        <label htmlFor="command-response" className={labelClass}>
          <LabelWithCount used={charLength(response)} max={RESPONSE_MAX}>
            回應內容
          </LabelWithCount>
        </label>
        <Textarea
          id="command-response"
          rows={3}
          value={response}
          disabled={busy}
          onChange={(e) => setResponse(e.target.value)}
        />
        <FieldError reason={fieldErrors.response} />
        <CommandVariables />
      </div>

      <div>
        <label htmlFor="command-aliases" className={labelClass}>
          別名（最多 {ALIASES_MAX} 個，用空白或逗號分隔）
        </label>
        <Input
          id="command-aliases"
          value={aliasText}
          placeholder="!hello !hey"
          disabled={busy}
          onChange={(e) => setAliasText(e.target.value)}
        />
        <FieldError reason={fieldErrors.aliases} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="command-global-cooldown" className={labelClass}>
            全體冷卻（秒）
          </label>
          <Input
            id="command-global-cooldown"
            type="number"
            min={0}
            max={COOLDOWN_MAX}
            value={globalCooldown}
            disabled={busy}
            onChange={(e) => setGlobalCooldown(e.target.value)}
          />
          <FieldError reason={fieldErrors.global_cooldown} />
        </div>
        <div>
          <label htmlFor="command-user-cooldown" className={labelClass}>
            個人冷卻（秒）
          </label>
          <Input
            id="command-user-cooldown"
            type="number"
            min={0}
            max={COOLDOWN_MAX}
            value={userCooldown}
            disabled={busy}
            onChange={(e) => setUserCooldown(e.target.value)}
          />
          <FieldError reason={fieldErrors.user_cooldown} />
        </div>
        <div>
          <label htmlFor="command-permission" className={labelClass}>
            誰可以觸發
          </label>
          <Select
            id="command-permission"
            value={permission}
            disabled={busy}
            onChange={(e) => setPermission(e.target.value as CommandPermission)}
          >
            {PERMISSIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <FieldError reason={fieldErrors.permission} />
        </div>
      </div>
      <p className="-mt-2 text-sm text-gray-600 dark:text-gray-400">
        冷卻 0 表示不限制；實況主與 mod 不受冷卻限制。權限有高低：選「mod」時 mod 與實況主都能觸發。
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} disabled={busy} onChange={(e) => setEnabled(e.target.checked)} />
        啟用這個指令（關閉後觀眾觸發不會有回應）
      </label>

      {conflict && (
        <ConflictNotice
          current={conflict.current}
          mine={toConflictValues(conflict.mine)}
          format={formatConflictField}
          busy={busy}
          subject="這個指令"
          onOverwrite={(latest) => {
            setBase(fromConflictValues(latest))
            void submit(fromConflictValues(latest))
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
        <Button type="submit" disabled={busy}>
          儲存
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
        {base !== null && (
          <Button variant="danger" type="button" disabled={busy} onClick={() => void remove()} className="ml-auto">
            刪除
          </Button>
        )}
      </div>
    </form>
  )
}
