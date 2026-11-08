import type { ChannelOption } from "@/lib/dashboard-options"
import { selectClass } from "./select-class"

interface Props {
  id?: string
  /** 頻道選項；null 表示載入中 */
  options: ChannelOption[] | null
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}

/** 頻道選單。目前的值不在選項內（例如已失效的頻道）時仍顯示出來並標註，讓使用者知道要換掉。 */
export function ChannelSelect({ id, options, value, onChange, disabled }: Props) {
  const missing = value !== null && options !== null && !options.some((o) => o.id === value)
  return (
    <select
      id={id}
      className={selectClass}
      value={value ?? ""}
      disabled={disabled || options === null}
      onChange={(e) => onChange(e.target.value || null)}
    >
      {options === null ? (
        <option value="">載入中…</option>
      ) : (
        <>
          <option value="">選擇頻道</option>
          {missing && <option value={value}>{value}（無法使用）</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              # {o.name}
            </option>
          ))}
        </>
      )}
    </select>
  )
}
