"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Input, Select } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { registerDraft } from "@/lib/dashboard-draft"
import {
  MAX_ROOM_NAME,
  deleteLobby,
  fetchLobbyOptions,
  normalizeTemplate,
  parseLobbyProblem,
  previewRoomName,
  saveLobby,
  templateTooLong,
  type Lobby,
  type LobbyOptions,
  type LobbyValues,
} from "@/lib/dashboard-dynamic-voice"
import { ConflictNotice } from "./conflict-notice"
import { WarnIcon } from "./icons"

/** 表單暫存的內容：還原時回到同一份原始值與使用者已輸入的內容 */
export interface LobbyFormDraft {
  original: LobbyValues | null
  channelId: string | null
  template: string
}

export const LOBBY_DRAFT_KEY = "dynamic-voice:lobby"

interface Props {
  guildId: string
  /** 打開表單時的設定；null 表示新增（沒有設定） */
  lobby: Lobby | null
  /** 還原暫存時帶入使用者已輸入的內容 */
  restored?: LobbyFormDraft
  onClose: () => void
  /** 存檔成功後呼叫，帶回存檔後的設定 */
  onSaved: (lobby: Lobby) => void
  /** 在表單內移除成功（或發現已被移除）後呼叫，讓一覽重新載入 */
  onRemoved: () => void
}

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{children}</span>
    </p>
  )
}

export function LobbyForm({ guildId, lobby, restored, onClose, onSaved, onRemoved }: Props) {
  const [base, setBase] = useState<LobbyValues | null>(
    restored ? restored.original : lobby ? { channel_id: lobby.channel.id, template: lobby.template } : null,
  )
  // 頻道已失效時不帶入舊值，使用者必須重新選
  const [channelId, setChannelId] = useState<string | null>(
    restored ? restored.channelId : lobby && !lobby.channel.invalid ? lobby.channel.id : null,
  )
  const [template, setTemplate] = useState<string>(restored ? restored.template : (lobby?.template ?? ""))
  const [options, setOptions] = useState<LobbyOptions | null>(null)
  const [optionsError, setOptionsError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ current: LobbyValues | null; mine: LobbyValues } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchLobbyOptions(guildId, controller.signal)
      .then(setOptions)
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load lobby options failed", e)
        setOptionsError(true)
      })
    return () => controller.abort()
  }, [guildId])

  const stateRef = useRef<LobbyFormDraft>({ original: base, channelId, template })
  stateRef.current = { original: base, channelId, template }
  useEffect(() => registerDraft(LOBBY_DRAFT_KEY, base === null ? "create" : "edit", () => stateRef.current), [base])

  const selected = options?.channels.find((c) => c.id === channelId) ?? null
  const tooLong = templateTooLong(template)
  const canSave = !busy && channelId !== null && !tooLong

  const mine = (): LobbyValues => ({ channel_id: channelId ?? "", template: normalizeTemplate(template) })

  const formatConflict = (field: string, value: string | null) => {
    if (field === "channel_id") {
      const c = options?.channels.find((o) => o.id === value)
      return c ? `${c.category ?? "（無分類）"} / ${c.name}` : (value ?? "無")
    }
    if (field === "template") return value ? value : "預設"
    return value ?? "無"
  }

  async function submit(against: LobbyValues | null) {
    if (channelId === null) return
    setBusy(true)
    setNotice(null)
    setTemplateError(null)
    setConflict(null)
    const values = mine()
    try {
      const res = await saveLobby(guildId, values, against)
      if (res.lobby) onSaved(res.lobby)
      else onRemoved()
      onClose()
    } catch (e) {
      const problem = parseLobbyProblem(e)
      if (problem?.kind === "conflict" || problem?.kind === "already_exists") {
        setConflict({ current: problem.current, mine: values })
      } else if (problem?.kind === "invalid_field") {
        if (problem.field === "template") setTemplateError(`名稱模板超過 ${MAX_ROOM_NAME} 個字元的上限。`)
        else setNotice("這個頻道不能當大廳，請重新選擇。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save lobby failed", e)
        setNotice("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!base) return
    if (!window.confirm("確定要移除大廳設定嗎？現有房間不受影響，大廳頻道本身不會被刪除。")) return
    setBusy(true)
    setNotice(null)
    setConflict(null)
    try {
      await deleteLobby(guildId, base)
      onRemoved()
      onClose()
    } catch (e) {
      const problem = parseLobbyProblem(e)
      if (problem?.kind === "conflict" && problem.current === null) {
        // 已被移除：目的已達成
        onRemoved()
        onClose()
      } else if (problem?.kind === "conflict" && problem.current) {
        // 已被修改：表單換成最新內容，請使用者確認後再決定
        setBase(problem.current)
        setChannelId(problem.current.channel_id)
        setTemplate(problem.current.template ?? "")
        setNotice("大廳設定已在你編輯期間被別人修改，表單已更新成最新內容，請確認後再決定是否移除。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete lobby failed", e)
        setNotice("移除失敗，請稍後再試。")
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
      <h3 className="font-serif text-lg text-primary dark:text-silver">{base === null ? "設定大廳" : "編輯大廳"}</h3>

      {optionsError && <p className="text-sm text-red-700 dark:text-red-300">無法載入頻道選項，請重新整理。</p>}
      {lobby?.channel.invalid && base !== null && (
        <Problem>原本的大廳頻道已失效（{lobby.channel.invalid}），請重新選擇頻道，或直接移除設定。</Problem>
      )}

      <div>
        <label htmlFor="lobby-channel" className={labelClass}>
          大廳頻道（必填）
        </label>
        <Select
          id="lobby-channel"
          value={channelId ?? ""}
          disabled={busy || options === null}
          onChange={(e) => setChannelId(e.target.value || null)}
        >
          {options === null ? (
            <option value="">載入中…</option>
          ) : (
            <>
              <option value="">選擇語音頻道</option>
              {channelId !== null && selected === null && <option value={channelId}>{channelId}（無法使用）</option>}
              {options.channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category ?? "（無分類）"} / {c.name}
                </option>
              ))}
            </>
          )}
        </Select>
        {selected && selected.permission_issues.length > 0 && (
          <ul className="mt-2 space-y-1">
            {selected.permission_issues.map((issue) => (
              <li key={issue.permission} className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
                <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
                <span>
                  bot 缺少 {issue.permission}：{issue.consequence}（仍可儲存）
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="lobby-template" className={labelClass}>
          房間名稱模板（留空使用預設，可用 {"{member}"} 代表建立者的 username）
        </label>
        <Input
          id="lobby-template"
          value={template}
          disabled={busy}
          aria-invalid={tooLong || templateError !== null}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-all">
          預覽：<span className="text-foreground">{previewRoomName(template, options?.username ?? null)}</span>
        </p>
        {tooLong && (
          <Problem>
            名稱模板太長：{"{member}"} 以 32 個字元估算，整個房名不能超過 {MAX_ROOM_NAME} 個字元。
          </Problem>
        )}
        {templateError && <Problem>{templateError}</Problem>}
      </div>

      {conflict && (
        <ConflictNotice
          subject="大廳設定"
          current={conflict.current}
          mine={conflict.mine}
          format={formatConflict}
          busy={busy}
          onOverwrite={(latest) => {
            const against: LobbyValues = { channel_id: latest.channel_id ?? "", template: latest.template ?? null }
            setBase(against)
            void submit(against)
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
        <Button type="submit" disabled={!canSave}>
          儲存
        </Button>
        <Button type="button" disabled={busy} onClick={onClose}>
          取消
        </Button>
        {base !== null && (
          <Button variant="danger" type="button" disabled={busy} onClick={() => void remove()} className="ml-auto">
            移除
          </Button>
        )}
      </div>
    </form>
  )
}
