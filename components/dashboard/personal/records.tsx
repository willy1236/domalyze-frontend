"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Button } from "@/components/ui"
import type { PersonalOverview } from "@/lib/dashboard-personal"
import {
  GIVEAWAY_RESULT_LABELS,
  KIND_LABELS,
  WARNING_TYPE_LABELS,
  fetchRecords,
  fetchVoice,
  formatRecordTime,
  formatSpan,
  formatVoiceMinutes,
  guildLabel,
  type RecordKind,
  type RecordKinds,
} from "@/lib/dashboard-records"
import { useLoad } from "@/lib/use-load"
import { DiscordIdentity } from "./discord-identity"
import { PersonalSection } from "./personal-section"

const mutedClass = "text-sm text-gray-500 dark:text-gray-400"
const errorClass = "text-sm text-red-700 dark:text-red-300"
const KINDS = Object.keys(KIND_LABELS) as RecordKind[]

function Row({ title, meta, children }: { title: ReactNode; meta: string; children?: ReactNode }) {
  return (
    <li className="py-3 border-t border-champagne/15 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="min-w-0 break-words">{title}</span>
        <span className={`${mutedClass} shrink-0`}>{meta}</span>
      </div>
      {children}
    </li>
  )
}

export function RecordRow({ kind, item }: { kind: RecordKind; item: RecordKinds[RecordKind] }) {
  switch (kind) {
    case "warnings": {
      const w = item as RecordKinds["warnings"]
      return (
        <Row title={`${WARNING_TYPE_LABELS[w.type]}　${guildLabel(w.guild_name)}`} meta={formatRecordTime(w.at)}>
          <p className={`${mutedClass} break-words`}>
            {w.reason || "沒有理由"}
            {w.duration_seconds !== null && `　時長：${formatSpan(w.duration_seconds)}`}
          </p>
        </Row>
      )
    }
    case "polls": {
      const p = item as RecordKinds["polls"]
      return (
        <Row title={p.title ?? "已刪除的投票"} meta={formatRecordTime(p.at)}>
          <p className={`${mutedClass} break-words`}>
            {guildLabel(p.guild_name)}　選項：{p.options.join("、")}
          </p>
        </Row>
      )
    }
    case "bets": {
      const b = item as RecordKinds["bets"]
      return (
        <Row title={b.title ?? "已刪除的賭盤"} meta={formatRecordTime(b.at)}>
          <p className={`${mutedClass} break-words`}>
            選項：{b.option ?? "未知"}　金額：{b.amount.toLocaleString("zh-TW")}
          </p>
        </Row>
      )
    }
    case "giveaways": {
      const g = item as RecordKinds["giveaways"]
      return (
        <Row title={g.prize ?? "已刪除的抽獎"} meta={formatRecordTime(g.at)}>
          <p className={`${mutedClass} break-words`}>
            {guildLabel(g.guild_name)}　{GIVEAWAY_RESULT_LABELS[g.result]}
          </p>
        </Row>
      )
    }
  }
}

function VoiceList({ discordId }: { discordId: string }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchVoice(discordId, signal), [discordId])
  const { data, failed } = useLoad(fetcher)
  if (failed) return <p className={errorClass}>語音時數載入失敗。</p>
  if (!data) return <p className={mutedClass}>載入中…</p>
  if (data.items.length === 0) return <p className={mutedClass}>沒有紀錄</p>
  return (
    <ul>
      {data.items.map((v, i) => (
        <Row key={i} title={guildLabel(v.guild_name)} meta={formatVoiceMinutes(v.minutes)} />
      ))}
    </ul>
  )
}

function KindList({ kind, discordId }: { kind: RecordKind; discordId: string }) {
  const fetcher = useCallback((signal: AbortSignal) => fetchRecords(kind, discordId, 0, signal), [kind, discordId])
  const { data, failed } = useLoad(fetcher)
  const [extra, setExtra] = useState<RecordKinds[RecordKind][]>([])
  const [busy, setBusy] = useState(false)
  const [moreFailed, setMoreFailed] = useState(false)

  if (failed) return <p className={errorClass}>載入失敗。</p>
  if (!data) return <p className={mutedClass}>載入中…</p>
  const items: RecordKinds[RecordKind][] = [...data.items, ...extra]
  if (items.length === 0) return <p className={mutedClass}>沒有紀錄</p>

  async function loadMore() {
    setBusy(true)
    setMoreFailed(false)
    try {
      const page = await fetchRecords(kind, discordId, items.length)
      // 載入期間有新紀錄時 offset 會往後推，下一頁開頭會與目前最後一筆重複，以 id 去重
      setExtra((prev) => {
        const seen = new Set([...data!.items, ...prev].map((i) => i.id))
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))]
      })
    } catch {
      setMoreFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ul>
        {items.map((item, i) => (
          <RecordRow key={`${item.id}-${i}`} kind={kind} item={item} />
        ))}
      </ul>
      {items.length < data.total && (
        <div className="pt-3">
          <Button type="button" size="sm" disabled={busy} onClick={loadMore}>
            {busy ? "載入中…" : "載入更多"}
          </Button>
        </div>
      )}
      {moreFailed && <p className={errorClass}>載入失敗，請再試一次。</p>}
    </>
  )
}

function DiscordRecords({ discord }: { discord: PersonalOverview["discords"][number] }) {
  const [kind, setKind] = useState<RecordKind>("warnings")
  return (
    <div className="min-w-0 py-4 first:pt-0">
      <DiscordIdentity discord={discord} />
      <h3 className="mt-4 mb-1 text-sm tracking-widest text-champagne">語音時數</h3>
      <VoiceList discordId={discord.id} />
      <div role="group" aria-label="紀錄類型" className="mt-6 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === kind}
            onClick={() => setKind(k)}
            className={`min-h-9 px-3 rounded-md border text-sm transition-colors ${
              k === kind
                ? "border-champagne bg-champagne text-background-dark"
                : "border-champagne/30 text-champagne hover:bg-champagne/10"
            }`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <KindList key={kind} kind={kind} discordId={discord.id} />
      </div>
    </div>
  )
}

/** 紀錄區塊：語音時數、警告、投票、賭盤與抽獎，帶析域帳號時每個連結的 Discord 各一組 */
export function RecordsSection({ overview }: { overview: PersonalOverview }) {
  return (
    <PersonalSection title="紀錄">
      <div className="divide-y divide-champagne/15">
        {overview.discords.map((d) => (
          <DiscordRecords key={d.id} discord={d} />
        ))}
      </div>
    </PersonalSection>
  )
}
