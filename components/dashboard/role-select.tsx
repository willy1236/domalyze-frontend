import type { RoleOption } from "@/lib/dashboard-options"
import { selectClass } from "./select-class"

interface Props {
  id?: string
  /** 身分組選項；null 表示載入中 */
  options: RoleOption[] | null
  /** null 表示不 tag 身分組 */
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}

/** 身分組選單，第一項是「不 tag 身分組」。目前的值不在選項內時仍顯示並標註。 */
export function RoleSelect({ id, options, value, onChange, disabled }: Props) {
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
          <option value="">不 tag 身分組</option>
          {missing && <option value={value}>{value}（無法使用）</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              @ {o.name}
            </option>
          ))}
        </>
      )}
    </select>
  )
}
