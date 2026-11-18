"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, type ReactNode } from "react"
import { Button } from "@/components/ui"
import { sectionBasePath } from "@/lib/dashboard-sections"
import {
  channelLabel,
  fetchPoll,
  formatDateTime,
  hiddenResultsText,
  missingPermissionsText,
  roleLabel,
  statusLabel,
  visibilityLabel,
  voterLabel,
  type PollDetail,
} from "@/lib/dashboard-polls"
import { useLoad } from "@/lib/use-load"
import { WarnIcon } from "./icons"
import { PollActions } from "./poll-actions"
import { PollExportLink } from "./poll-export-link"

const REFRESH_MS = 30_000
const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className={`text-sm ${muted}`}>{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

function Results({ detail }: { detail: PollDetail }) {
  const hidden = hiddenResultsText(detail)
  if (hidden || !detail.counts) {
    return <p className={`mt-2 text-sm ${muted}`}>{hidden}</p>
  }
  const max = Math.max(1, ...detail.counts.map((c) => c.count))
  return (
    <ul className="mt-2 space-y-3 text-sm">
      {detail.counts.map((c) => (
        <li key={c.option_id}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="break-words min-w-0">{c.name}</span>
            <span className="tabular-nums shrink-0">{c.count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-sm bg-primary/10 dark:bg-champagne/15">
            <div
              className="h-full rounded-sm bg-primary dark:bg-champagne"
              style={{ width: `${(c.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** 單一投票：設定、依可見範圍顯示的票數與明細；進行中每 30 秒自動更新。 */
export function PollDetailView({ guildId, pollId }: { guildId: string; pollId: number }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchPoll(guildId, pollId, signal), [guildId, pollId])
  const { data: detail, failed, loading, reload } = useLoad(fetcher)

  const active = detail?.status === "active"
  const reloadRef = useRef(reload)
  useEffect(() => {
    reloadRef.current = reload
  })
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void reloadRef.current()
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [active])

  const permissionWarning = detail ? missingPermissionsText(detail.missing_permissions) : null
  const optionName = (id: number) => detail?.options.find((o) => o.option_id === id)?.name ?? String(id)

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver break-words min-w-0">{detail?.title ?? "投票"}</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`${sectionBasePath(guildId)}/polls`}
            className={`inline-flex items-center rounded-sm border border-primary/30 dark:border-champagne/40 px-3 py-1 text-sm hover:bg-primary/5 dark:hover:bg-champagne/10 ${linkClass}`}
          >
            回清單
          </Link>
          <Button type="button" size="sm" disabled={loading} onClick={() => void reload()}>
            重新整理
          </Button>
        </div>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入這個投票，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void reload()}>
            重試
          </button>
          。
        </p>
      )}
      {detail === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {detail && (
        <div className="space-y-8 pt-5">
          {permissionWarning && (
            <div role="alert" className="rounded-md border border-red-700/40 dark:border-red-300/40 p-4">
              <p className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
                <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
                <span className="break-words">{permissionWarning.full}</span>
              </p>
            </div>
          )}
          {detail.message_failure && (
            <div role="status" className="rounded-md border border-red-700/40 dark:border-red-300/40 p-4">
              <p className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
                <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
                <span className="break-words">訊息未更新：{detail.message_failure_text ?? detail.message_failure}</span>
              </p>
            </div>
          )}
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="狀態">{statusLabel(detail.status)}</Field>
            <Field label="投票人數">{detail.voter_count} 人</Field>
            <Field label="發起人">{detail.creator_name ?? detail.creator_id}</Field>
            <Field label="頻道">
              {channelLabel(detail)}
              {detail.message_url && (
                <>
                  {" "}
                  <a href={detail.message_url} target="_blank" rel="noreferrer" className={`underline ${linkClass}`}>
                    跳到投票訊息
                  </a>
                </>
              )}
            </Field>
            <Field label="建立時間">{formatDateTime(detail.created_at)}</Field>
            {active ? (
              <Field label="截止時間">{detail.deadline ? formatDateTime(detail.deadline) : "沒有截止時間"}</Field>
            ) : (
              <Field label="結算時間">{detail.ended_at ? formatDateTime(detail.ended_at) : "—"}</Field>
            )}
            <Field label="投票方式">{detail.show_name ? "實名" : "匿名"}</Field>
            <Field label="結果可見範圍">{visibilityLabel(detail.results_visibility)}</Field>
            <Field label="每人可投">{detail.number_of_user_votes} 個選項</Field>
            {detail.only_roles.length > 0 && (
              <Field label="限定身分組">{detail.only_roles.map(roleLabel).join("、")}</Field>
            )}
            {detail.role_weights.length > 0 && (
              <Field label="身分組權重">
                {detail.role_weights.map((r) => `${roleLabel(r)} ×${r.weight}`).join("、")}
              </Field>
            )}
          </dl>

          <div className="space-y-3 empty:hidden">
            <PollActions guildId={guildId} detail={detail} onChanged={reload} />
            <PollExportLink guildId={guildId} detail={detail} onChanged={reload} />
          </div>

          <div>
            <h3 className="font-serif text-xl text-primary dark:text-silver">結果</h3>
            <Results detail={detail} />
          </div>

          {detail.votes && (
            <div>
              <h3 className="font-serif text-xl text-primary dark:text-silver">
                投票明細 <span className={`text-base tabular-nums ${muted}`}>{detail.votes.length}</span>
              </h3>
              {detail.votes.length === 0 ? (
                <p className={`mt-2 text-sm ${muted}`}>還沒有人投票。</p>
              ) : (
                <ul className="mt-2 divide-y divide-primary/10 dark:divide-champagne/10 text-sm">
                  {detail.votes.map((v) => (
                    <li
                      key={`${v.user_id}-${v.option_id}`}
                      className="py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1"
                    >
                      <span className={`break-all ${v.left ? muted : ""}`}>{voterLabel(v)}</span>
                      <span className="flex flex-wrap items-center gap-x-3 tabular-nums">
                        <span className="break-words">
                          {optionName(v.option_id)}
                          {v.weight !== 1 && ` ×${v.weight}`}
                        </span>
                        <span className={muted}>{formatDateTime(v.voted_at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
