import type { ReactNode } from "react"
import type { NotifyItem } from "@/lib/dashboard-notifies"
import { NotifyRow } from "./notify-item"

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

export function CommunityNotifySection({ items, headerActions }: { items: NotifyItem[]; headerActions?: ReactNode }) {
  const groups = groupByAccount(items)
  return (
    <section id="community-notifies" className="scroll-mt-6">
      <header className="flex items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">
          社群推播 <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">{items.length}</span>
        </h2>
        {headerActions}
      </header>
      {groups.length === 0 ? (
        <p className="py-8 text-gray-600 dark:text-gray-400">還沒有設定任何社群推播。</p>
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
                  <NotifyRow key={item.key} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
