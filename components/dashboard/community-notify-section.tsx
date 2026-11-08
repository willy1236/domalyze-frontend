"use client"

import { useState, type ReactNode } from "react"
import { consumeDraft } from "@/lib/dashboard-draft"
import type { NotifyItem } from "@/lib/dashboard-notifies"
import {
  COMMUNITY_DRAFT_KEY,
  CommunityNotifyForm,
  editCommunityDraft,
  newCommunityDraft,
  type CommunityFormDraft,
} from "./community-notify-form"
import { NotifyRow } from "./notify-item"

const buttonClass =
  "border border-champagne/40 text-champagne px-3 py-1.5 text-xs tracking-widest uppercase hover:bg-champagne hover:text-background-dark transition-colors disabled:opacity-60"

/** 從 reauth 或 session 過期回來時，還原導向前未送出的新增流程或編輯表單 */
function restoreForm(): CommunityFormDraft | null {
  return consumeDraft<CommunityFormDraft>(COMMUNITY_DRAFT_KEY)?.state ?? null
}

/** 同一個帳號的推播收在一起，一個帳號的開台、影片、剪輯不必重複寫帳號 */
function groupByAccount(items: NotifyItem[]): { id: string; label: string; handle: string; items: NotifyItem[] }[] {
  const groups = new Map<string, { id: string; label: string; handle: string; items: NotifyItem[] }>()
  for (const item of items) {
    const account = item.account
    if (!account) continue
    const groupKey = `${item.key.startsWith("community:2") ? "yt" : item.key.startsWith("community:5") ? "tw" : "twitch"}:${account.id}`
    const group = groups.get(groupKey) ?? {
      id: groupKey,
      label: account.display_name,
      handle: account.username,
      items: [],
    }
    group.items.push(item)
    groups.set(groupKey, group)
  }
  return [...groups.values()]
}

interface Props {
  guildId: string
  items: NotifyItem[]
  /** 新增、修改、刪除後重新載入一覽 */
  onChanged: () => void
  headerActions?: ReactNode
}

export function CommunityNotifySection({ guildId, items, onChanged, headerActions }: Props) {
  const groups = groupByAccount(items)
  const [form, setForm] = useState<CommunityFormDraft | null>(restoreForm)
  const [formId, setFormId] = useState(0)
  const open = (draft: CommunityFormDraft) => {
    setForm(draft)
    setFormId((n) => n + 1)
  }
  return (
    <section id="community-notifies" className="scroll-mt-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">
          社群推播 <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">{items.length}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" className={buttonClass} onClick={() => open(newCommunityDraft())}>
            ＋ 新增推播
          </button>
          {headerActions}
        </div>
      </header>
      {form && (
        <CommunityNotifyForm
          key={formId}
          guildId={guildId}
          items={items}
          initial={form}
          onClose={() => setForm(null)}
          onChanged={onChanged}
        />
      )}
      {groups.length === 0 ? (
        <p className="py-8 text-gray-600 dark:text-gray-400">
          還沒有設定任何社群推播。按「新增推播」貼上 Twitch、YouTube 或 Twitter 的帳號名稱或網址，帳號有新動態時 bot 會通知你指定的頻道。
        </p>
      ) : (
        <div className="divide-y divide-primary/10 dark:divide-champagne/10">
          {groups.map((group) => (
            <div key={group.id} className="py-5">
              <p className="break-all">
                <span className="font-serif text-xl text-primary dark:text-silver">{group.label}</span>
                {group.handle !== group.label && (
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">（{group.handle}）</span>
                )}
              </p>
              <ul className="mt-1 divide-y divide-primary/5 dark:divide-champagne/5">
                {group.items.map((item) => (
                  <NotifyRow
                    key={item.key}
                    item={item}
                    actions={
                      <button type="button" className={buttonClass} onClick={() => open(editCommunityDraft(item))}>
                        編輯
                      </button>
                    }
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
