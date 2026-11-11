"use client"

import { useCallback, useState, type ReactNode } from "react"
import { MemberPicker, type PickedMember } from "@/components/dashboard/member-picker"
import { MemberRecords } from "@/components/dashboard/member-records"
import { WarningRecordRow } from "@/components/dashboard/warning-record-row"
import { Button, Select } from "@/components/ui"
import {
  fetchWarnings,
  kindLabel,
  WARNING_KINDS,
  type WarningKind,
  type WarningRecord,
} from "@/lib/dashboard-warnings"
import { useLoad } from "@/lib/use-load"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

interface WarningListProps {
  guildId: string
  /** 標題列右側的動作插槽（W-02 放新增懲處） */
  headerActions?: (reload: () => void) => ReactNode
  /** 每列的動作插槽（W-03 放移除） */
  rowActions?: (record: WarningRecord, reload: () => void) => ReactNode
}

/** 本伺服器的懲處紀錄：由新到舊，每頁 50 筆，可依成員、種類篩選；進入頁面時載入，另有手動重新整理。 */
export function WarningList({ guildId, headerActions, rowActions }: WarningListProps) {
  const [member, setMember] = useState<PickedMember | null>(null)
  const [kind, setKind] = useState<WarningKind | null>(null)
  const [page, setPage] = useState(1)
  const [crossGuildFor, setCrossGuildFor] = useState<string | null>(null)

  const fetcher = useCallback(
    (signal: AbortSignal) => fetchWarnings(guildId, { member: member?.id ?? null, kind, page }, signal),
    [guildId, member, kind, page],
  )
  const { data, failed, loading, reload: load } = useLoad(fetcher, { keepPrevious: true })

  const filtered = member !== null || kind !== null
  const reload = () => void load()

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">警告</h2>
        <div className="flex flex-wrap items-center gap-3">
          {headerActions?.(reload)}
          <Button type="button" size="sm" disabled={loading} onClick={reload}>
            重新整理
          </Button>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <MemberPicker
          guildId={guildId}
          label="依成員篩選"
          onPick={(m) => {
            setMember(m)
            setPage(1)
          }}
        />
        <div className="w-36">
          <Select
            aria-label="依種類篩選"
            value={kind ?? ""}
            onChange={(e) => {
              setKind((e.target.value || null) as WarningKind | null)
              setPage(1)
            }}
          >
            <option value="">全部種類</option>
            {WARNING_KINDS.map((k) => (
              <option key={k} value={k}>
                {kindLabel(k)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {member && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>
            成員：<strong>{member.label}</strong>
          </span>
          <button type="button" className={`underline ${linkClass}`} onClick={() => setCrossGuildFor(member.id)}>
            查詢跨群紀錄
          </button>
          <button
            type="button"
            className={`underline ${linkClass}`}
            onClick={() => {
              setMember(null)
              setCrossGuildFor(null)
              setPage(1)
            }}
          >
            清除成員
          </button>
        </p>
      )}

      {crossGuildFor && <MemberRecords guildId={guildId} userId={crossGuildFor} onClose={() => setCrossGuildFor(null)} />}

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入紀錄，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={reload}>
            重試
          </button>
          。
        </p>
      )}
      {data === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {data &&
        (data.warnings.length === 0 && page === 1 ? (
          <p className={`py-8 ${muted}`}>
            {filtered ? "沒有符合條件的紀錄。" : "目前沒有紀錄。用「新增懲處」或 /warning、/timeout、/kick、/ban 懲處成員後，會列在這裡。"}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-primary/10 dark:divide-champagne/10">
            {data.warnings.map((w) => (
              <WarningRecordRow key={w.id} record={w} actions={rowActions?.(w, reload)} />
            ))}
          </ul>
        ))}

      {data && (page > 1 || data.has_next) && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Button type="button" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            上一頁
          </Button>
          <span className="tabular-nums">
            第 {page} 頁・共 {data.total} 筆
          </span>
          <Button type="button" size="sm" disabled={!data.has_next || loading} onClick={() => setPage(page + 1)}>
            下一頁
          </Button>
        </div>
      )}
    </section>
  )
}
