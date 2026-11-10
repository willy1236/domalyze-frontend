"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { Button } from "@/components/ui"
import {
  fetchGiveaway,
  formatDateTime,
  participantLabel,
  statusLabel,
  type GiveawayDetail,
  type GiveawayParticipant,
} from "@/lib/dashboard-giveaways"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function Person({ p }: { p: GiveawayParticipant }) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      {p.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar_url} alt="" width={20} height={20} className="w-5 h-5 rounded-full shrink-0" />
      )}
      <span className={`break-all ${p.left ? muted : ""}`}>{participantLabel(p)}</span>
    </span>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className={`text-sm ${muted}`}>{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

/** 單一抽獎：基本資料、中獎者、參加者。`actions` 是操作插槽（G-02 放提前結束與重抽），拿到目前詳情與重新載入函式。 */
export function GiveawayDetailView({
  guildId,
  giveawayId,
  onBack,
  actions,
}: {
  guildId: string
  giveawayId: number
  onBack: () => void
  actions?: (detail: GiveawayDetail, reload: () => Promise<void>) => ReactNode
}) {
  const [detail, setDetail] = useState<GiveawayDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setFailed(false)
      setLoading(true)
      try {
        setDetail(await fetchGiveaway(guildId, giveawayId, signal))
      } catch (e) {
        if (signal?.aborted) return
        console.error("load giveaway failed", e)
        setFailed(true)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [guildId, giveawayId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const active = detail?.status === "active"

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver break-words min-w-0">
          {detail?.prize_name ?? "抽獎"}
        </h2>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={onBack}>
            回清單
          </Button>
          <Button type="button" size="sm" disabled={loading} onClick={() => void load()}>
            重新整理
          </Button>
        </div>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入這個抽獎，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void load()}>
            重試
          </button>
          。
        </p>
      )}
      {detail === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {detail && (
        <div className="space-y-8 pt-5">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="狀態">{statusLabel(detail.status)}</Field>
            <Field label="抽出人數">{detail.winner_count} 人</Field>
            <Field label="發起人">{detail.creator_name ?? detail.creator_id}</Field>
            <Field label="頻道">
              {detail.channel_name ? `#${detail.channel_name}` : "頻道已不存在"}
              {detail.message_url && (
                <>
                  {" "}
                  <a href={detail.message_url} target="_blank" rel="noreferrer" className={`underline ${linkClass}`}>
                    跳到抽獎訊息
                  </a>
                </>
              )}
            </Field>
            <Field label="建立時間">{formatDateTime(detail.created_at)}</Field>
            <Field label={active ? "預計開獎時間" : "結束時間"}>
              {detail.ends_at ? formatDateTime(detail.ends_at) : "—"}
            </Field>
            <Field label="重抽次數">{detail.redraw_count} 次</Field>
            <Field label="參加人數">{detail.participants.length} 人</Field>
            {detail.description && <Field label="描述">{detail.description}</Field>}
          </dl>

          {actions?.(detail, () => load())}

          <div>
            <h3 className="font-serif text-xl text-primary dark:text-silver">中獎者</h3>
            {detail.winners.length === 0 ? (
              <p className={`mt-2 text-sm ${muted}`}>{active ? "抽獎進行中，尚未開獎。" : "沒有中獎者。"}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {detail.winners.map((p) => (
                  <li key={p.id}>
                    <Person p={p} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-serif text-xl text-primary dark:text-silver">
              參加者 <span className={`text-base tabular-nums ${muted}`}>{detail.participants.length}</span>
            </h3>
            {detail.participants.length === 0 ? (
              <p className={`mt-2 text-sm ${muted}`}>還沒有人參加。</p>
            ) : (
              <ul className="mt-2 divide-y divide-primary/10 dark:divide-champagne/10 text-sm">
                {detail.participants.map((p) => (
                  <li key={p.id} className="py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                    <Person p={p} />
                    <span className="flex items-center gap-3 tabular-nums">
                      {p.is_winner && <span className="text-primary dark:text-champagne">中獎</span>}
                      <span className={muted}>{formatDateTime(p.joined_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
