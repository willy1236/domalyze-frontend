import type { NotifyItem } from "@/lib/dashboard-notifies"
import { NotifyItemCard } from "./notify-item"

export function ChannelNotifySection({ items }: { items: NotifyItem[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
        頻道通知（{items.length}）
      </h2>
      {items.length === 0 ? (
        <p className="border border-champagne/30 px-4 py-6 text-gray-500 dark:text-gray-400">
          還沒有設定任何頻道通知。
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <NotifyItemCard key={item.key} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}
