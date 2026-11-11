"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useGuildSections } from "@/components/dashboard/guild-sections"
import { MemberPicker, type PickedMember } from "@/components/dashboard/member-picker"
import { Button, Select, Textarea } from "@/components/ui"
import { DashboardApiError, getDashboardUserId } from "@/lib/dashboard-api"
import {
  allowedKinds,
  allowsIdOnly,
  buildPunishRequest,
  DELETE_MESSAGE_OPTIONS,
  fetchAnnounceChannels,
  kindLabel,
  MAX_REASON_LENGTH,
  punish,
  punishErrorText,
  punishResultLines,
  TIMEOUT_OPTIONS,
  validatePunish,
  type AnnounceChannel,
  type PunishDraft,
  type PunishFieldErrors,
  type WarningKind,
} from "@/lib/dashboard-warnings"
import { WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"
const errorClass = "mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300"
const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null
  return (
    <p id={id} role="alert" className={errorClass}>
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{text}</span>
    </p>
  )
}

function initialDraft(kind: WarningKind): PunishDraft {
  return {
    kind,
    userId: null,
    reason: "",
    crossGuild: false,
    durationSeconds: 600,
    deleteMessageSeconds: 0,
    announceChannelId: "",
  }
}

interface PunishDialogProps {
  guildId: string
  kinds: WarningKind[]
  open: boolean
  onClose: () => void
  onDone: () => void
}

function PunishDialog({ guildId, kinds, open, onClose, onDone }: PunishDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const uid = useId()
  const [draft, setDraft] = useState<PunishDraft>(() => initialDraft(kinds[0]))
  const [picked, setPicked] = useState<PickedMember | null>(null)
  const [errors, setErrors] = useState<PunishFieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<{ ok: boolean; lines: string[] } | null>(null)
  const [channels, setChannels] = useState<AnnounceChannel[] | null>(null)
  const [channelsFailed, setChannelsFailed] = useState(false)

  // 目前分頁的種類被收回權限時退回第一個可用的種類
  const kind = kinds.includes(draft.kind) ? draft.kind : kinds[0]

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setChannelsFailed(false)
    fetchAnnounceChannels(guildId, controller.signal)
      .then(setChannels)
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        console.error("load announce channels failed", e)
        setChannelsFailed(true)
      })
    return () => controller.abort()
  }, [open, guildId])

  const patch = (changes: Partial<PunishDraft>) => setDraft((d) => ({ ...d, ...changes }))

  const switchKind = (next: WarningKind) => {
    // 禁言與踢出只能選成員：換到這類分頁時，用 ID 填的對象要重選
    if (!allowsIdOnly(next)) setPicked(null)
    patch({ kind: next, userId: allowsIdOnly(next) ? draft.userId : null })
    setErrors({})
    setOutcome(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const current: PunishDraft = { ...draft, kind, userId: picked?.id ?? null }
    const found = validatePunish(current, getDashboardUserId())
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    setOutcome(null)
    try {
      const res = await punish(guildId, buildPunishRequest(current))
      const shown = punishResultLines(kind, res)
      setOutcome(shown)
      if (shown.ok) {
        setPicked(null)
        setDraft((d) => ({ ...initialDraft(kind), announceChannelId: d.announceChannelId, crossGuild: d.crossGuild }))
        onDone()
      }
    } catch (err) {
      if (!(err instanceof DashboardApiError && err.handled)) {
        console.error("punish failed", err)
        const api = err instanceof DashboardApiError ? err : null
        setOutcome({ ok: false, lines: [punishErrorText(api?.code ?? null, api?.body?.fields)] })
      }
    } finally {
      setBusy(false)
    }
  }

  const reasonId = `${uid}-reason`
  const userErrId = `${uid}-user-error`
  const reasonErrId = `${uid}-reason-error`
  const durationErrId = `${uid}-duration-error`
  const reasonLength = draft.reason.trim().length

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-title`}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-md border border-primary/20 dark:border-champagne/25 bg-background-light dark:bg-background-dark text-inherit p-5 backdrop:bg-black/50"
    >
      <h3 id={`${uid}-title`} className="font-serif text-lg text-primary dark:text-silver">
        新增懲處
      </h3>

      <div role="tablist" aria-label="懲處種類" className="mt-3 flex flex-wrap gap-1 border-b border-primary/20 dark:border-champagne/25">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`${uid}-tab-${k}`}
            aria-selected={k === kind}
            aria-controls={`${uid}-panel`}
            disabled={busy}
            onClick={() => switchKind(k)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-sm ${focusRing} ${
              k === kind
                ? "border-primary dark:border-champagne font-medium"
                : `border-transparent ${muted} hover:text-primary dark:hover:text-champagne`
            }`}
          >
            {kindLabel(k)}
          </button>
        ))}
      </div>

      <form id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${kind}`} onSubmit={submit} noValidate className="mt-4 space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium">對象</span>
          {picked ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <strong>{picked.label}</strong>
              <button
                type="button"
                className={`underline rounded-sm ${focusRing}`}
                disabled={busy}
                onClick={() => {
                  setPicked(null)
                  patch({ userId: null })
                }}
              >
                重新選擇
              </button>
            </p>
          ) : (
            <MemberPicker
              key={kind}
              guildId={guildId}
              label="選擇對象"
              allowId={allowsIdOnly(kind)}
              disableBots
              onPick={(m) => {
                setPicked(m)
                patch({ userId: m.id })
              }}
            />
          )}
          {!allowsIdOnly(kind) && <p className={`mt-1 text-xs ${muted}`}>只能選伺服器內的成員。</p>}
          <FieldError id={userErrId} text={errors.user} />
        </div>

        {kind === "timeout" && (
          <div>
            <label htmlFor={`${uid}-duration`} className="mb-1 block text-sm font-medium">
              禁言時長
            </label>
            <Select
              id={`${uid}-duration`}
              value={draft.durationSeconds}
              aria-describedby={errors.duration ? durationErrId : undefined}
              onChange={(e) => patch({ durationSeconds: Number(e.target.value) })}
            >
              {TIMEOUT_OPTIONS.map((o) => (
                <option key={o.seconds} value={o.seconds}>
                  {o.label}
                </option>
              ))}
            </Select>
            <FieldError id={durationErrId} text={errors.duration} />
          </div>
        )}

        <div>
          <label htmlFor={reasonId} className="mb-1 block text-sm font-medium">
            原因{kind === "warning" || kind === "ban" ? "" : "（選填）"}
          </label>
          <Textarea
            id={reasonId}
            rows={2}
            value={draft.reason}
            aria-invalid={errors.reason ? true : undefined}
            aria-describedby={errors.reason ? reasonErrId : undefined}
            onChange={(e) => patch({ reason: e.target.value })}
          />
          <p className={`mt-1 text-xs tabular-nums ${reasonLength > MAX_REASON_LENGTH ? "text-red-700 dark:text-red-300" : muted}`}>
            {reasonLength} / {MAX_REASON_LENGTH}
          </p>
          <FieldError id={reasonErrId} text={errors.reason} />
        </div>

        {(kind === "timeout" || kind === "ban") && (
          <div>
            <label htmlFor={`${uid}-delete`} className="mb-1 block text-sm font-medium">
              刪除對象最近的訊息
            </label>
            <Select
              id={`${uid}-delete`}
              value={draft.deleteMessageSeconds}
              onChange={(e) => patch({ deleteMessageSeconds: Number(e.target.value) })}
            >
              {DELETE_MESSAGE_OPTIONS.map((o) => (
                <option key={o.seconds} value={o.seconds}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.crossGuild}
            onChange={(e) => patch({ crossGuild: e.target.checked })}
            className="mt-1"
          />
          <span>
            存入跨群系統
            <span className={`block text-xs ${muted}`}>勾選後，其他伺服器查詢這位成員時也看得到這筆紀錄。</span>
          </span>
        </label>

        <div>
          <label htmlFor={`${uid}-announce`} className="mb-1 block text-sm font-medium">
            公告頻道
          </label>
          <Select
            id={`${uid}-announce`}
            value={draft.announceChannelId}
            disabled={channels === null && !channelsFailed}
            onChange={(e) => patch({ announceChannelId: e.target.value })}
          >
            <option value="">不公告</option>
            {channels?.map((c) => (
              <option key={c.id} value={c.id}>
                # {c.name}
              </option>
            ))}
          </Select>
          {channelsFailed && <p className={`mt-1 text-xs ${muted}`}>無法載入頻道清單，仍可不公告直接執行。</p>}
        </div>

        {outcome && (
          <div
            role={outcome.ok ? "status" : "alert"}
            className={`space-y-1 rounded-md border px-3 py-2 text-sm ${
              outcome.ok
                ? "border-primary/20 dark:border-champagne/25"
                : "border-red-700/40 text-red-700 dark:border-red-300/40 dark:text-red-300"
            }`}
          >
            {outcome.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant={kind === "warning" ? "outline" : "danger"} disabled={busy}>
            {busy ? "執行中…" : `執行${kindLabel(kind)}`}
          </Button>
          <Button type="button" disabled={busy} onClick={onClose}>
            關閉
          </Button>
        </div>
      </form>
    </dialog>
  )
}

/** 警告區塊標題列的「新增懲處」：只列出使用者有權限的種類，一個都沒有就不顯示按鈕。完成後呼叫 reload 更新清單。 */
export function PunishForm({ guildId, reload }: { guildId: string; reload: () => void }) {
  const { can } = useGuildSections()
  const [open, setOpen] = useState(false)
  const kinds = allowedKinds((action) => can("warnings", action))
  if (kinds.length === 0) return null
  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        新增懲處
      </Button>
      <PunishDialog guildId={guildId} kinds={kinds} open={open} onClose={() => setOpen(false)} onDone={reload} />
    </>
  )
}
