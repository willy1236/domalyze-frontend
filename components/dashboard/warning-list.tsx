"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { MemberRecords } from "@/components/dashboard/member-records"
import { WarningRecordRow } from "@/components/dashboard/warning-record-row"
import { Button, Input, Select } from "@/components/ui"
import {
  fetchWarnings,
  isUserId,
  kindLabel,
  searchMembers,
  WARNING_KINDS,
  type MemberSearchResult,
  type WarningKind,
  type WarningRecord,
  type WarningsResponse,
} from "@/lib/dashboard-warnings"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
const optionClass = `w-full px-3 py-2 text-left text-sm hover:bg-primary/5 dark:hover:bg-champagne/10 ${linkClass}`

interface PickedMember {
  id: string
  label: string
}

/** 以名稱或 ID 搜尋成員；純數字的 ID 也可以直接使用（對象已離開伺服器時仍查得到舊紀錄）。 */
function MemberPicker({ guildId, onPick }: { guildId: string; onPick: (m: PickedMember) => void }) {
  const [text, setText] = useState("")
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const query = text.trim()

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchMembers(guildId, query, controller.signal)
        .then(setResults)
        .catch((e: unknown) => {
          if (!controller.signal.aborted) console.error("member search failed", e)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [guildId, query])

  const pick = (m: PickedMember) => {
    onPick(m)
    setText("")
    setResults([])
  }
  const shown = query ? results : []

  return (
    <div className="relative min-w-0 flex-1 basis-56">
      <Input
        type="search"
        aria-label="依成員篩選"
        placeholder="輸入成員名稱或 ID"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {query && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark shadow-lg">
          {shown.map((m) => (
            <li key={m.id}>
              <button type="button" className={optionClass} onClick={() => pick({ id: m.id, label: m.name })}>
                {m.name}
                <span className={`ml-2 ${muted}`}>@{m.username}</span>
              </button>
            </li>
          ))}
          {isUserId(query) && !shown.some((m) => m.id === query) && (
            <li>
              <button type="button" className={optionClass} onClick={() => pick({ id: query, label: query })}>
                使用 ID {query}
              </button>
            </li>
          )}
          {shown.length === 0 && !isUserId(query) && <li className={`px-3 py-2 text-sm ${muted}`}>找不到成員</li>}
        </ul>
      )}
    </div>
  )
}

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
  const [data, setData] = useState<WarningsResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [crossGuildFor, setCrossGuildFor] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      setLoading(true)
      try {
        setData(await fetchWarnings(guildId, { member: member?.id ?? null, kind, page }, signal))
      } catch (e) {
        if (signal?.aborted) return
        console.error("load warnings failed", e)
        setFailed(true)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [guildId, member, kind, page],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

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
            {filtered ? "沒有符合條件的紀錄。" : "目前沒有紀錄。用 /warning、/timeout、/kick、/ban 懲處成員後，會列在這裡。"}
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
