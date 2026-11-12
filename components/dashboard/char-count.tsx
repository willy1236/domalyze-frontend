import type { ReactNode } from "react"

/** 欄位的即時字數「目前／上限」，超過時轉紅。`used` 由呼叫端依該欄位的驗證規則計算（trim、正規化或估算）。 */
export function CharCount({ used, max, prefix }: { used: number; max: number; prefix?: string }) {
  const over = used > max
  return (
    <span className={`shrink-0 text-xs tabular-nums ${over ? "text-red-700 dark:text-red-300" : "text-gray-600 dark:text-gray-400"}`}>
      {prefix}
      {used}／{max}
    </span>
  )
}

/** 標籤列：左邊標籤文字，右邊字數。放在 `<label>` 內使用。 */
export function LabelWithCount({ children, used, max, prefix }: { children: ReactNode; used: number; max: number; prefix?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span>{children}</span>
      <CharCount used={used} max={max} prefix={prefix} />
    </span>
  )
}
