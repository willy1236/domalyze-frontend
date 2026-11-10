"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { consumeDraft } from "@/lib/dashboard-draft"
import {
  DEFAULT_ROOM_NAME_HINT,
  deleteLobby,
  fetchLobby,
  lobbyValues,
  parseLobbyProblem,
  type Lobby,
  type LobbyResponse,
} from "@/lib/dashboard-dynamic-voice"
import { HashIcon, WarnIcon } from "./icons"
import { LOBBY_DRAFT_KEY, LobbyForm, type LobbyFormDraft } from "./lobby-form"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

/** 身分組位階無法用權限檢查判斷，所以不論狀態都顯示 */
function RoleOrderNote() {
  return (
    <p className={`text-sm ${muted}`}>
      提醒：bot 的身分組位階要調到比一般成員高，否則房間建立者拿不到房間的管理權限。
    </p>
  )
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{children}</span>
    </p>
  )
}

function LobbyView({ lobby }: { lobby: Lobby }) {
  const { channel } = lobby
  return (
    <div className="py-5 space-y-4">
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[8rem_1fr]">
        <dt className={muted}>大廳頻道</dt>
        <dd className="min-w-0">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <HashIcon className={`shrink-0 ${muted}`} />
            {channel.name ? (
              <span className="break-all">
                {channel.category ?? "（無分類）"} / {channel.name}
              </span>
            ) : (
              <span className={`break-all ${muted}`}>{channel.id}</span>
            )}
          </span>
          {channel.invalid && <Problem>頻道：{channel.invalid}</Problem>}
        </dd>

        <dt className={muted}>房間名稱模板</dt>
        <dd className="min-w-0">
          {lobby.template ? (
            <span className="break-words whitespace-pre-wrap">{lobby.template}</span>
          ) : (
            <span className={muted}>預設：{DEFAULT_ROOM_NAME_HINT}</span>
          )}
          {lobby.template_invalid && <Problem>模板：{lobby.template_invalid}</Problem>}
        </dd>
      </dl>

      {lobby.permission_issues.length > 0 && (
        <ul className="space-y-1">
          {lobby.permission_issues.map((issue) => (
            <li key={issue.permission} className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
              <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
              <span>
                bot 缺少 {issue.permission}：{issue.consequence}
              </span>
            </li>
          ))}
        </ul>
      )}

      <RoleOrderNote />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-8 space-y-3">
      <p className={muted}>
        還沒有設定動態語音。指定一個語音頻道當「大廳」後，有人進入大廳，bot 會在同一個分類下建立新的語音房間、把他移進去，
        並給他管理這個房間的權限；房間沒人時自動刪除。
      </p>
      <RoleOrderNote />
    </div>
  )
}

interface OpenForm {
  restored?: LobbyFormDraft
}

/** 從 reauth 或 session 過期回來時，還原導向前未送出的表單 */
function restoreForm(): OpenForm | null {
  const draft = consumeDraft<LobbyFormDraft>(LOBBY_DRAFT_KEY)
  return draft ? { restored: draft.state } : null
}

/** 動態語音的大廳設定。 */
export function LobbySection({ guildId }: { guildId: string }) {
  const [data, setData] = useState<LobbyResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [form, setForm] = useState<OpenForm | null>(restoreForm)
  const [formId, setFormId] = useState(0)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      try {
        setData(await fetchLobby(guildId, signal))
      } catch (e) {
        if (signal?.aborted) return
        console.error("load dynamic voice lobby failed", e)
        setFailed(true)
      }
    },
    [guildId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const openForm = () => {
    setForm({})
    setFormId((n) => n + 1)
  }

  // 一覽上的移除：確認後直接送出；表單內的移除走表單自己的流程
  const remove = async () => {
    const lobby = data?.lobby
    if (!lobby) return
    if (!window.confirm("確定要移除大廳設定嗎？現有房間不受影響，大廳頻道本身不會被刪除。")) return
    setRemoving(true)
    try {
      await deleteLobby(guildId, lobbyValues(lobby))
      await load()
    } catch (e) {
      const problem = parseLobbyProblem(e)
      if (problem?.kind === "conflict") {
        // 已被移除或修改：重新載入最新內容，由使用者重新決定
        await load()
        if (problem.current !== null) window.alert("大廳設定已在你操作期間被別人修改，已重新載入最新內容，請確認後再決定是否移除。")
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("delete lobby failed", e)
        window.alert("移除失敗，請稍後再試。")
      }
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section id="lobby" className="scroll-mt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">大廳設定</h2>
        {data && !form && (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={openForm}>
              {data.lobby ? "編輯" : "設定大廳"}
            </Button>
            {data.lobby && (
              <Button type="button" size="sm" variant="danger" disabled={removing} onClick={() => void remove()}>
                移除
              </Button>
            )}
          </div>
        )}
      </header>

      {form && (
        <LobbyForm
          key={formId}
          guildId={guildId}
          lobby={form.restored ? null : (data?.lobby ?? null)}
          restored={form.restored}
          onClose={() => setForm(null)}
          onSaved={(lobby) => setData({ lobby })}
          onRemoved={() => void load()}
        />
      )}

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入大廳設定，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}
      {data === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {data && (data.lobby ? <LobbyView lobby={data.lobby} /> : <EmptyState />)}
    </section>
  )
}
