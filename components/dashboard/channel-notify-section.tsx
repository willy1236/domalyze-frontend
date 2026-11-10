"use client"

import { useState, type ReactNode } from "react"
import { Button, Select } from "@/components/ui"
import { CHANNEL_NOTIFY_TYPES, type ChannelNotifyType, type ChannelNotifyValues } from "@/lib/dashboard-channel-notifies"
import { consumeDraft } from "@/lib/dashboard-draft"
import type { NotifyItem } from "@/lib/dashboard-notifies"
import { CHANNEL_DRAFT_KEY, ChannelNotifyForm, type ChannelFormDraft } from "./channel-notify-form"
import { NotifyRow } from "./notify-item"
import { TestNotifyButton } from "./test-notify-button"

interface OpenForm {
  type: ChannelNotifyType
  original: ChannelNotifyValues | null
  restored?: Pick<ChannelFormDraft, "channelId" | "roleId" | "message">
}

interface Props {
  guildId: string
  items: NotifyItem[]
  /** 新增、修改、刪除後重新載入一覽 */
  onChanged: () => void
  headerActions?: ReactNode
}

/** 從 reauth 或 session 過期回來時，還原導向前未送出的表單 */
function restoreForm(): OpenForm | null {
  const draft = consumeDraft<ChannelFormDraft>(CHANNEL_DRAFT_KEY)
  if (!draft) return null
  const type = CHANNEL_NOTIFY_TYPES.find((t) => t.key === draft.state.typeKey)
  if (!type) return null
  return { type, original: draft.state.original, restored: draft.state }
}

export function ChannelNotifySection({ guildId, items, onChanged, headerActions }: Props) {
  const [form, setForm] = useState<OpenForm | null>(restoreForm)
  const [formId, setFormId] = useState(0)

  const open = (type: ChannelNotifyType, original: ChannelNotifyValues | null) => {
    // 同時只開一個表單：換掉前先確認，免得不小心丟掉未存的輸入
    if (form && !window.confirm("目前開啟的表單尚未儲存，確定要換成另一個嗎？")) return
    setForm({ type, original })
    setFormId((n) => n + 1)
  }

  // 對已設定的種類按新增，打開的是那一筆的編輯
  const choose = (key: string) => {
    const type = CHANNEL_NOTIFY_TYPES.find((t) => t.key === key)
    if (!type) return
    const existing = items.find((i) => i.key === key)
    open(type, existing ? existing.values : null)
  }

  return (
    <section id="channel-notifies" className="scroll-mt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">
          頻道通知 <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">{items.length}</span>
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="add-channel-notify" className="sr-only">
            新增頻道通知
          </label>
          <Select
            id="add-channel-notify"
            className="max-w-[14rem]"
            value=""
            onChange={(e) => choose(e.target.value)}
          >
            <option value="">＋ 新增通知…</option>
            {CHANNEL_NOTIFY_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
                {items.some((i) => i.key === t.key) ? "（已設定）" : ""}
              </option>
            ))}
          </Select>
          {headerActions}
        </div>
      </header>

      {form && (
        <ChannelNotifyForm
          key={`${form.type.key}:${formId}`}
          guildId={guildId}
          type={form.type}
          original={form.original}
          restored={form.restored}
          onClose={() => setForm(null)}
          onChanged={onChanged}
        />
      )}

      {items.length === 0 ? (
        <p className="py-8 text-gray-600 dark:text-gray-400">
          還沒有設定任何頻道通知。從上方「新增通知」選擇種類，就能指定 bot 要把通知發到哪個頻道。
        </p>
      ) : (
        <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
          {items.map((item) => (
            <NotifyRow
              key={item.key}
              item={item}
              actions={
                <div className="flex flex-col items-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const type = CHANNEL_NOTIFY_TYPES.find((t) => t.key === item.key)
                      if (type) open(type, item.values)
                    }}
                  >
                    編輯
                  </Button>
                  <TestNotifyButton guildId={guildId} item={item} onChanged={onChanged} />
                </div>
              }
            />
          ))}
        </ul>
      )}
    </section>
  )
}
