"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useGuildSections } from "@/components/dashboard/guild-sections"
import { MemberPicker, type PickedMember } from "@/components/dashboard/member-picker"
import { Button, Input, Select, Textarea } from "@/components/ui"
import { DashboardApiError, getDashboardUserId } from "@/lib/dashboard-api"
import { useLoad } from "@/lib/use-load"
import {
  allowedKinds,
  allowsIdOnly,
  buildPunishRequest,
  DELETE_MESSAGE_OPTIONS,
  draftForKind,
  DURATION_UNITS,
  fetchAnnounceChannels,
  kindLabel,
  MAX_REASON_LENGTH,
  punish,
  punishErrorText,
  punishResultLines,
  TIMEOUT_OPTIONS,
  splitSeconds,
  toSeconds,
  validatePunish,
  type PunishDraft,
  type PunishFieldErrors,
  type WarningKind,
} from "@/lib/dashboard-warnings"
import { LabelWithCount } from "./char-count"
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

const CUSTOM = "custom"

interface SecondsFieldProps {
  id: string
  label: string
  presets: readonly { seconds: number; label: string }[]
  value: number
  onChange: (seconds: number) => void
  /** 多一個「自訂」選項，可填數字與單位 */
  allowCustom: boolean
  error?: string
  errorId: string
}

/** 預設選項的下拉；可選「自訂」改填數字加單位。外部重設值時請換 key。 */
function SecondsField({ id, label, presets, value, onChange, allowCustom, error, errorId }: SecondsFieldProps) {
  // 掛載時（例如切分頁再切回）值不在預設組內，代表這是自訂值：直接進自訂模式並回填數字與單位，
  // 否則 select 對不到選項、畫面與實際送出的值會不一致
  const [custom, setCustom] = useState(() => !presets.some((o) => o.seconds === value))
  const [initial] = useState(() => splitSeconds(value))
  const [amount, setAmount] = useState(initial.amount)
  const [unit, setUnit] = useState(initial.unit)

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Select
        id={id}
        value={custom ? CUSTOM : value}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => {
          if (e.target.value === CUSTOM) {
            setCustom(true)
            onChange(toSeconds(amount, unit))
          } else {
            setCustom(false)
            onChange(Number(e.target.value))
          }
        }}
      >
        {presets.map((o) => (
          <option key={o.seconds} value={o.seconds}>
            {o.label}
          </option>
        ))}
        {allowCustom && <option value={CUSTOM}>自訂…</option>}
      </Select>
      {custom && (
        <div className="mt-2 flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            aria-label={`${label}的數值`}
            value={amount}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setAmount(e.target.value)
              onChange(toSeconds(e.target.value, unit))
            }}
          />
          <div className="w-28 shrink-0">
            <Select
              aria-label={`${label}的單位`}
              value={unit}
              onChange={(e) => {
                const next = Number(e.target.value)
                setUnit(next)
                onChange(toSeconds(amount, next))
              }}
            >
              {DURATION_UNITS.map((u) => (
                <option key={u.size} value={u.size}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
      <FieldError id={errorId} text={error} />
    </div>
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
  // 送出成功重設表單時遞增，讓自訂欄位的內部狀態一起歸零
  const [formKey, setFormKey] = useState(0)

  // 目前分頁的種類被收回權限時退回第一個可用的種類
  const kind = kinds.includes(draft.kind) ? draft.kind : kinds[0]

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // 關閉時清掉上一次的結果，下次開啟不會看到舊訊息
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) setOutcome(null)
  }

  const channelsFetcher = useCallback((signal: AbortSignal) => fetchAnnounceChannels(guildId, signal), [guildId])
  const { data: channels, failed: channelsFailed } = useLoad(open ? channelsFetcher : null, { keepPrevious: true })

  const patch = (changes: Partial<PunishDraft>) => setDraft((d) => ({ ...d, ...changes }))

  const switchKind = (next: WarningKind) => {
    // 禁言與踢出只能選成員：換到這類分頁時，用 ID 填的對象要重選
    if (!allowsIdOnly(next)) setPicked(null)
    setDraft((d) => ({ ...draftForKind(d, next), userId: allowsIdOnly(next) ? d.userId : null }))
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
        setFormKey((n) => n + 1)
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
          <SecondsField
            key={`duration-${formKey}`}
            id={`${uid}-duration`}
            label="禁言時長"
            presets={TIMEOUT_OPTIONS}
            value={draft.durationSeconds}
            onChange={(seconds) => patch({ durationSeconds: seconds })}
            allowCustom
            error={errors.duration}
            errorId={durationErrId}
          />
        )}

        <div>
          <label htmlFor={reasonId} className="mb-1 block text-sm font-medium">
            <LabelWithCount used={reasonLength} max={MAX_REASON_LENGTH}>
              原因{kind === "warning" || kind === "ban" ? "" : "（選填）"}
            </LabelWithCount>
          </label>
          <Textarea
            id={reasonId}
            rows={2}
            value={draft.reason}
            aria-invalid={errors.reason ? true : undefined}
            aria-describedby={errors.reason ? reasonErrId : undefined}
            onChange={(e) => patch({ reason: e.target.value })}
          />
          <FieldError id={reasonErrId} text={errors.reason} />
        </div>

        {(kind === "timeout" || kind === "ban") && (
          <SecondsField
            key={`delete-${kind}-${formKey}`}
            id={`${uid}-delete`}
            label="刪除對象最近的訊息"
            presets={DELETE_MESSAGE_OPTIONS}
            value={draft.deleteMessageSeconds}
            onChange={(seconds) => patch({ deleteMessageSeconds: seconds })}
            allowCustom={kind === "timeout"}
            error={errors.delete}
            errorId={`${uid}-delete-error`}
          />
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
