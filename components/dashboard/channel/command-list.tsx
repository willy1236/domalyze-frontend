"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import {
  type ChannelCommand,
  commandSummary,
  fetchCommands,
  parseSaveProblem,
  saveCommand,
  valuesOf,
} from "@/lib/dashboard-channel-commands"
import { useLoad } from "@/lib/use-load"
import { useChannelError } from "./channel-access-guard"
import { CommandForm } from "./command-form"

interface RowsProps {
  commands: ChannelCommand[]
  /** 頻道的星羽還沒啟用：只能看，不能改 */
  readOnly: boolean
  busy?: boolean
  onEdit: (command: ChannelCommand) => void
  onToggle: (command: ChannelCommand) => void
}

/** 指令清單；沒有指令時顯示空狀態。 */
export function CommandRows({ commands, readOnly, busy, onEdit, onToggle }: RowsProps) {
  if (commands.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">還沒有自訂指令。</p>
  }
  return (
    <ul className="divide-y divide-champagne/20 border border-champagne/30">
      {commands.map((command) => (
        <li key={command.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className={command.enabled ? "font-medium" : "font-medium text-gray-500 dark:text-gray-400"}>
              !{command.name}
              {!command.enabled && <span className="ml-2 text-sm font-normal">（已關閉）</span>}
            </p>
            <p className="mt-1 break-words text-sm text-gray-600 dark:text-gray-400">{command.response}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {commandSummary(command)} · 已使用 {command.use_count} 次
            </p>
            {command.builtin_conflict?.renamed_from && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {`原名 !${command.builtin_conflict.renamed_from}，因與內建指令同名已改名`}
              </p>
            )}
            {command.builtin_conflict?.removed_aliases.map((alias) => (
              <p key={alias} className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {`別名 !${alias} 因與內建指令同名已移除`}
              </p>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={command.enabled}
              disabled={readOnly || busy}
              onChange={() => onToggle(command)}
              aria-label={`${command.enabled ? "關閉" : "開啟"} !${command.name}`}
            />
            啟用
          </label>
          <Button type="button" disabled={readOnly || busy} onClick={() => onEdit(command)}>
            編輯
          </Button>
        </li>
      ))}
    </ul>
  )
}

interface Props {
  channelId: string
  readOnly: boolean
  /** 收到 channel_not_enabled：頻道的啟用狀態已經變了，重新載入頻道資料 */
  onNotEnabled: () => void
}

/** 頻道的自訂指令管理：清單、新增、編輯、刪除與開關。 */
export function CommandList({ channelId, readOnly, onNotEnabled }: Props) {
  const fetcher = useCallback((signal: AbortSignal) => fetchCommands(channelId, signal), [channelId])
  const { data, error, reload } = useLoad(fetcher)
  // undefined：沒有開表單；null：新增；指令：編輯
  const [editing, setEditing] = useState<ChannelCommand | null | undefined>(undefined)
  const leaveIfUnlinked = useChannelError()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function toggle(command: ChannelCommand) {
    const original = valuesOf(command)
    setBusy(true)
    setNotice(null)
    try {
      await saveCommand(channelId, command.name, { ...original, enabled: !command.enabled }, original)
    } catch (e) {
      if (leaveIfUnlinked(e)) return
      const problem = parseSaveProblem(e)
      if (problem?.kind === "not_enabled") onNotEnabled()
      else if (problem?.kind === "conflict") setNotice("這個指令剛被別人修改，已重新載入，請確認後再操作。")
      else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("toggle command failed", e)
        setNotice("操作失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
      await reload()
    }
  }

  return (
    <div>
      {readOnly && (
        <p className="mb-4 border border-champagne/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          星羽還沒有在這個頻道啟用，啟用後才能修改指令。
        </p>
      )}
      {error ? (
        <div className="border border-champagne/30 px-4 py-6 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入，請稍後再試。</p>
          <Button type="button" onClick={() => void reload()}>
            重新載入
          </Button>
        </div>
      ) : data === null ? (
        <div className="min-h-[10vh]" aria-busy="true" />
      ) : (
        <>
          <CommandRows commands={data.commands} readOnly={readOnly} busy={busy} onEdit={setEditing} onToggle={(c) => void toggle(c)} />
          {notice && (
            <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
              {notice}
            </p>
          )}
          {editing === undefined && !readOnly && (
            <Button type="button" className="mt-4" onClick={() => setEditing(null)}>
              新增指令
            </Button>
          )}
        </>
      )}
      {editing !== undefined && !readOnly && (
        <CommandForm
          // 換一個指令就重新掛載，表單才會帶入新的初始值
          key={editing?.name ?? "new"}
          channelId={channelId}
          original={editing}
          onClose={() => setEditing(undefined)}
          onChanged={() => void reload()}
          onNotEnabled={onNotEnabled}
        />
      )}
    </div>
  )
}
