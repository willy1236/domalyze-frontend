import type { ReactNode } from "react"
import type { NotifyItem } from "@/lib/dashboard-notifies"
import { NotifyRow } from "./notify-item"

export function ChannelNotifySection({ items, headerActions }: { items: NotifyItem[]; headerActions?: ReactNode }) {
  return (
    <section id="channel-notifies" className="scroll-mt-6">
      <header className="flex items-baseline justify-between gap-3 border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">
          頻道通知 <span className="text-base text-gray-600 dark:text-gray-400 tabular-nums">{items.length}</span>
        </h2>
        {headerActions}
      </header>
      {items.length === 0 ? (
        <p className="py-8 text-gray-600 dark:text-gray-400">還沒有設定任何頻道通知。</p>
      ) : (
        <ul className="divide-y divide-primary/10 dark:divide-champagne/10">
          {items.map((item) => (
            <NotifyRow key={item.key} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}
