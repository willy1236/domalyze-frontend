"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import { Button, Input, Select } from "@/components/ui"
import { buttonClass } from "@/components/ui/button-styles"
import { DashboardApiError } from "@/lib/dashboard-api"
import { charLength, type FieldError } from "@/lib/dashboard-message"
import {
  OPTIONS_MAX,
  OPTION_MAX,
  TITLE_MAX,
  VOTES_MAX,
  WEIGHT_MAX,
  WEIGHT_MIN,
  buildPollBody,
  createPoll,
  emptyPollForm,
  fetchPollOptions,
  mapServerFieldErrors,
  parseCreateProblem,
  validatePollForm,
  type PollChannelOption,
  type PollFieldErrors,
  type PollFormValues,
} from "@/lib/dashboard-poll-create"
import { pollHref } from "@/lib/dashboard-polls"
import { useLoad } from "@/lib/use-load"
import type { ManagerRoleOption } from "@/lib/dashboard-tickets"
import { CharCount, LabelWithCount } from "./char-count"
import { WarnIcon } from "./icons"
import { RoleMultiSelect } from "./role-multi-select"

const labelClass = "block text-sm text-gray-600 dark:text-gray-400 mb-1"
const checkClass = "flex items-center gap-2 text-sm"

function Problem({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{children}</span>
    </p>
  )
}

function ChannelOptions({ channels }: { channels: PollChannelOption[] }) {
  // 後端已依分類與位置排好，這裡只照順序分組
  const groups: { category: string; items: PollChannelOption[] }[] = []
  for (const c of channels) {
    const category = c.category ?? "（無分類）"
    const last = groups[groups.length - 1]
    if (last && last.category === category) last.items.push(c)
    else groups.push({ category, items: [c] })
  }
  return (
    <>
      {groups.map((g) => (
        <optgroup key={g.category} label={g.category}>
          {g.items.map((c) => (
            <option key={c.id} value={c.id} disabled={c.disabled_reason !== null}>
              # {c.name}
              {c.disabled_reason ? `（${c.disabled_reason}）` : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}

interface OptionRow {
  key: number
  text: string
}

/** 後台發起投票的表單；送出成功後導到詳細頁。 */
export function PollForm({ guildId }: { guildId: string }) {
  const router = useRouter()
  const fetcher = useCallback((signal: AbortSignal) => fetchPollOptions(guildId, signal), [guildId])
  const { data: options, failed: optionsFailed, reload } = useLoad(fetcher)

  const [initial] = useState(emptyPollForm)
  const nextKey = useRef(initial.options.length)
  const [rows, setRows] = useState<OptionRow[]>(() => initial.options.map((text, key) => ({ key, text })))
  const [form, setForm] = useState<Omit<PollFormValues, "options">>(initial)
  const [errors, setErrors] = useState<PollFieldErrors>({})
  const [formErrors, setFormErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const values: PollFormValues = { ...form, options: rows.map((r) => r.text) }
  const patch = (p: Partial<Omit<PollFormValues, "options">>) => setForm((f) => ({ ...f, ...p }))

  const roleOptions: ManagerRoleOption[] | null = useMemo(
    () => options?.roles.map((r) => ({ ...r, disabled_reason: null })) ?? null,
    [options],
  )
  const usedWeightRoles = new Set(form.roleWeights.map((w) => w.roleId))

  async function submit() {
    setNotice(null)
    setFormErrors([])
    const local = validatePollForm(values)
    setErrors(local)
    if (Object.keys(local).length > 0) return
    setBusy(true)
    try {
      const result = await createPoll(guildId, buildPollBody(values))
      router.push(pollHref(guildId, result.poll_id))
      return
    } catch (e) {
      const problem = parseCreateProblem(e)
      if (problem?.kind === "invalid") {
        const mapped = mapServerFieldErrors(values, problem.fields)
        setErrors(mapped.errors)
        setFormErrors(mapped.rest)
      } else if (problem?.kind === "message") {
        setNotice(problem.text)
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("create poll failed", e)
        setNotice("發起失敗，請稍後再試。")
      }
    }
    setBusy(false)
  }

  const optionCount = rows.filter((r) => r.text.trim() !== "").length

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <header className="border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">發起投票</h2>
      </header>

      {optionsFailed && (
        <p className="text-sm text-red-700 dark:text-red-300">
          無法載入頻道與身分組，請
          <button type="button" className="underline mx-1" onClick={() => void reload()}>
            重試
          </button>
          。
        </p>
      )}

      <div>
        <label htmlFor="poll-channel" className={labelClass}>
          頻道
        </label>
        <Select
          id="poll-channel"
          value={form.channelId ?? ""}
          disabled={busy || options === null}
          aria-invalid={!!errors.channel_id}
          onChange={(e) => patch({ channelId: e.target.value || null })}
        >
          {options === null ? (
            <option value="">載入中…</option>
          ) : (
            <>
              <option value="">選擇頻道</option>
              <ChannelOptions channels={options.channels} />
            </>
          )}
        </Select>
        {errors.channel_id && <Problem>{errors.channel_id}</Problem>}
      </div>

      <div>
        <label htmlFor="poll-title" className={labelClass}>
          <LabelWithCount used={charLength(form.title.trim())} max={TITLE_MAX}>
            標題
          </LabelWithCount>
        </label>
        <Input
          id="poll-title"
          className="w-full"
          value={form.title}
          disabled={busy}
          aria-invalid={!!errors.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
        {errors.title && <Problem>{errors.title}</Problem>}
      </div>

      <fieldset className="min-w-0">
        <legend className={labelClass}>選項</legend>
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.key}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`poll-option-${r.key}`} className="sr-only">
                    選項 {i + 1}
                  </label>
                  <Input
                    id={`poll-option-${r.key}`}
                    className="w-full"
                    value={r.text}
                    disabled={busy}
                    aria-invalid={!!errors[`options.${i}`]}
                    onChange={(e) => setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, text: e.target.value } : x)))}
                  />
                </div>
                <CharCount used={charLength(r.text.trim())} max={OPTION_MAX} />
                <Button
                  type="button"
                  size="sm"
                  aria-label={`移除選項 ${i + 1}`}
                  disabled={busy || rows.length <= 1}
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                >
                  移除
                </Button>
              </div>
              {errors[`options.${i}`] && <Problem>{errors[`options.${i}`]}</Problem>}
            </li>
          ))}
        </ul>
        {errors.options && <Problem>{errors.options}</Problem>}
        <Button
          type="button"
          size="sm"
          className="mt-2"
          disabled={busy || rows.length >= OPTIONS_MAX}
          onClick={() => setRows((rs) => [...rs, { key: nextKey.current++, text: "" }])}
        >
          新增選項（{rows.length}／{OPTIONS_MAX}）
        </Button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="sr-only">投票設定</legend>
        <label className={checkClass}>
          <input type="checkbox" checked={form.showName} disabled={busy} onChange={(e) => patch({ showName: e.target.checked })} />
          顯示投票人（實名）
        </label>
        <label className={checkClass}>
          <input
            type="checkbox"
            checked={form.checkResultsInAdvance}
            disabled={busy}
            onChange={(e) => patch({ checkResultsInAdvance: e.target.checked })}
          />
          預先查看結果
        </label>
        <label className={checkClass}>
          <input
            type="checkbox"
            checked={form.resultsOnlyInitiator}
            disabled={busy}
            onChange={(e) => patch({ resultsOnlyInitiator: e.target.checked })}
          />
          僅限發起人能查看結果
        </label>
      </fieldset>

      <div>
        <label htmlFor="poll-votes" className={labelClass}>
          一人最多可投票數
        </label>
        <Input
          id="poll-votes"
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.min(VOTES_MAX, Math.max(optionCount, 1))}
          className="w-24"
          value={form.numberOfUserVotes}
          disabled={busy}
          aria-invalid={!!errors.number_of_user_votes}
          onChange={(e) => patch({ numberOfUserVotes: e.target.value })}
        />
        {errors.number_of_user_votes && <Problem>{errors.number_of_user_votes}</Problem>}
      </div>

      <RoleMultiSelect
        legend="限定身分組（不選代表不限）"
        options={roleOptions}
        value={form.onlyRoles}
        disabled={busy}
        onChange={(onlyRoles) => patch({ onlyRoles })}
      />

      <fieldset className="min-w-0">
        <legend className={labelClass}>身分組權重（{WEIGHT_MIN}–{WEIGHT_MAX}）</legend>
        <ul className="space-y-2">
          {form.roleWeights.map((w, i) => (
            <li key={i}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    aria-label={`權重身分組 ${i + 1}`}
                    value={w.roleId}
                    disabled={busy || roleOptions === null}
                    aria-invalid={!!errors[`role_weights.${i}.role`]}
                    onChange={(e) =>
                      patch({ roleWeights: form.roleWeights.map((x, j) => (j === i ? { ...x, roleId: e.target.value } : x)) })
                    }
                  >
                    <option value="">選擇身分組</option>
                    {roleOptions?.map((r) => (
                      <option key={r.id} value={r.id} disabled={usedWeightRoles.has(r.id) && r.id !== w.roleId}>
                        @ {r.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={WEIGHT_MIN}
                  max={WEIGHT_MAX}
                  aria-label={`權重 ${i + 1}`}
                  className="w-20"
                  value={w.weight}
                  disabled={busy}
                  aria-invalid={!!errors[`role_weights.${i}.weight`]}
                  onChange={(e) =>
                    patch({ roleWeights: form.roleWeights.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)) })
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  aria-label={`移除權重 ${i + 1}`}
                  disabled={busy}
                  onClick={() => patch({ roleWeights: form.roleWeights.filter((_, j) => j !== i) })}
                >
                  移除
                </Button>
              </div>
              {errors[`role_weights.${i}.role`] && <Problem>{errors[`role_weights.${i}.role`]}</Problem>}
              {errors[`role_weights.${i}.weight`] && <Problem>{errors[`role_weights.${i}.weight`]}</Problem>}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          size="sm"
          className="mt-2"
          disabled={busy || roleOptions === null}
          onClick={() => patch({ roleWeights: [...form.roleWeights, { roleId: "", weight: "1" }] })}
        >
          新增權重
        </Button>
      </fieldset>

      {formErrors.length > 0 && (
        <ul role="alert">
          {formErrors.map((f, i) => (
            <li key={i}>
              <Problem>{f.reason}</Problem>
            </li>
          ))}
        </ul>
      )}
      {notice && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{notice}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || options === null}>
          發起
        </Button>
        <Link href={`/dashboard/guilds/${encodeURIComponent(guildId)}/polls`} className={buttonClass("outline", "md")}>
          取消
        </Link>
      </div>
    </form>
  )
}
