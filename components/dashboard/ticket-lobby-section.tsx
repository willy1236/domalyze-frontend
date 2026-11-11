"use client"

import { useCallback, type ReactNode } from "react"
import { Button } from "@/components/ui"
import { formatDateTime } from "@/lib/dashboard-giveaways"
import {
  fetchTickets,
  limitSummary,
  lobbyInvalidMessage,
  memberLabel,
  targetLabel,
  type TicketItem,
  type TicketLobby,
} from "@/lib/dashboard-tickets"
import { useLoad } from "@/lib/use-load"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
const warnBox = "mt-2 rounded-sm border border-amber-600/50 dark:border-amber-400/50 px-3 py-2 text-sm"

/** 一個私人頻道；`actions` 是 P-04 放鎖定、重開、刪除按鈕的插槽。 */
export function TicketRow({ ticket, actions }: { ticket: TicketItem; actions?: ReactNode }) {
  const locked = ticket.status === "locked"
  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-medium break-words">
          <a href={ticket.jump_url} target="_blank" rel="noopener noreferrer" className={`underline ${linkClass}`}>
            {ticket.channel.name ? `#${ticket.channel.name}` : `頻道 ${ticket.channel.id}`}
            <span className="sr-only">（在 Discord 開啟，新分頁）</span>
          </a>
          <span
            className={`ml-2 rounded-sm border px-1.5 py-0.5 text-xs ${
              locked ? "border-amber-600/60 dark:border-amber-400/60" : "border-primary/30 dark:border-champagne/30"
            }`}
          >
            {locked ? "已鎖定" : "開啟中"}
          </span>
        </span>
        {actions && <span className="flex flex-wrap items-center gap-3">{actions}</span>}
      </div>
      <p className={`mt-1 break-words ${muted}`}>
        建立者：{memberLabel(ticket.creator)}　建立於 {formatDateTime(ticket.created_at)}
        {locked && (
          <>
            <br />
            鎖定者：{memberLabel(ticket.closer)}
            {ticket.closed_at && `　鎖定於 ${formatDateTime(ticket.closed_at)}`}
          </>
        )}
      </p>
    </li>
  )
}

function TicketList({ tickets, actions }: { tickets: TicketItem[]; actions?: (ticket: TicketItem) => ReactNode }) {
  return (
    <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
      {tickets.map((t) => (
        <TicketRow key={t.channel.id} ticket={t} actions={actions?.(t)} />
      ))}
    </ul>
  )
}

function categoryText(category: TicketLobby["category"]): string {
  if (category.id === null) return "尚未設定"
  return category.name ?? `分類 ${category.id}（已被刪除）`
}

/** 一個大廳：設定、失效標示、bot 權限警告與底下的私人頻道；`actions` 是 P-02 放編輯與移除的插槽。 */
export function TicketLobbyItem({
  lobby,
  actions,
  ticketActions,
}: {
  lobby: TicketLobby
  actions?: ReactNode
  ticketActions?: (ticket: TicketItem) => ReactNode
}) {
  const invalid = lobbyInvalidMessage(lobby.invalid_reason)
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-serif text-lg text-primary dark:text-silver break-words">
          {lobby.channel.name ? `#${lobby.channel.name}` : "大廳頻道已不存在"}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {!lobby.channel.invalid && (
            <a href={lobby.jump_url} target="_blank" rel="noopener noreferrer" className={`underline ${linkClass}`}>
              在 Discord 開啟<span className="sr-only">（新分頁）</span>
            </a>
          )}
          {actions}
        </div>
      </div>

      {invalid && (
        <p className={warnBox} role="status">
          <strong>已失效：</strong>
          {invalid}。
        </p>
      )}

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
        <dt className={muted}>私人頻道所在分類</dt>
        <dd className="break-words">{categoryText(lobby.category)}</dd>
        <dt className={muted}>管理身分組</dt>
        <dd className="break-words">
          {lobby.manager_roles.length === 0
            ? "無"
            : lobby.manager_roles.map((r) => (r.name ? `@${r.name}` : `身分組 ${r.id}（已被刪除）`)).join("、")}
        </dd>
        <dt className={muted}>頻道名稱前綴</dt>
        <dd className="break-words">{lobby.name_prefix}</dd>
        <dt className={muted}>開單限制</dt>
        <dd>{limitSummary(lobby)}</dd>
        <dt className={muted}>私人頻道</dt>
        <dd>
          {lobby.ticket_count} 個（其中已鎖定 {lobby.locked_count} 個）
        </dd>
      </dl>

      {lobby.permission_issues.length > 0 && (
        <div className={warnBox} role="status">
          <p className="font-medium">bot 缺少下列權限，會有以下後果：</p>
          <ul className="mt-1 list-disc pl-5">
            {lobby.permission_issues.map((i) => (
              <li key={`${i.target}-${i.permission}`}>
                {targetLabel(i.target)}的 {i.permission}：{i.consequence}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        {lobby.tickets.length === 0 ? (
          <p className={`text-sm ${muted}`}>這個大廳目前沒有私人頻道。</p>
        ) : (
          <TicketList tickets={lobby.tickets} actions={ticketActions} />
        )}
      </div>
    </li>
  )
}

interface TicketLobbySectionProps {
  guildId: string
  /** 標題列右側的插槽（P-02 放新增大廳）；收到重新載入函式 */
  headerActions?: (reload: () => void) => ReactNode
  /** 每個大廳的動作插槽（P-02 編輯與移除） */
  lobbyActions?: (lobby: TicketLobby, reload: () => void) => ReactNode
  /** 每個私人頻道的動作插槽（P-04 鎖定、重開、刪除） */
  ticketActions?: (ticket: TicketItem, reload: () => void) => ReactNode
}

/** 私人頻道區塊：大廳一覽與私人頻道清單，進入頁面時載入並檢查 Discord 現況，另有手動重新整理。 */
export function TicketLobbySection({ guildId, headerActions, lobbyActions, ticketActions }: TicketLobbySectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => fetchTickets(guildId, signal), [guildId])
  const { data, failed, loading, reload: load } = useLoad(fetcher)
  const reload = useCallback(() => void load(), [load])
  const rowActions = ticketActions && ((t: TicketItem) => ticketActions(t, reload))

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">私人頻道</h2>
        <div className="flex flex-wrap items-center gap-3">
          {headerActions?.(reload)}
          <Button type="button" size="sm" disabled={loading} onClick={reload}>
            重新整理
          </Button>
        </div>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入私人頻道，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={reload}>
            重試
          </button>
          。
        </p>
      )}
      {data === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {data &&
        (data.lobbies.length === 0 && data.unassigned.length === 0 ? (
          <p className={`py-8 ${muted}`}>
            目前沒有私人頻道大廳。大廳是一則帶有開單按鈕的訊息，成員按一下就會建立只有自己與管理者看得到的私人頻道。
          </p>
        ) : (
          <>
            {data.lobbies.length > 0 && (
              <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
                {data.lobbies.map((l) => (
                  <TicketLobbyItem
                    key={l.channel.id}
                    lobby={l}
                    actions={lobbyActions?.(l, reload)}
                    ticketActions={rowActions}
                  />
                ))}
              </ul>
            )}
            {data.unassigned.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-lg text-primary dark:text-silver">未歸屬的私人頻道</h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  這些私人頻道對不到任何大廳，不占任何大廳的名額；只有伺服器層級 Manage Channels 的人能處理。
                </p>
                <TicketList tickets={data.unassigned} actions={rowActions} />
              </div>
            )}
          </>
        ))}
    </section>
  )
}
