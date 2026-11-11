import type { ManagerRoleOption } from "@/lib/dashboard-tickets"

interface Props {
  legend: string
  /** 身分組選項；null 表示載入中 */
  options: ManagerRoleOption[] | null
  /** 已選的身分組 ID */
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  /** 說明或錯誤文字的元素 id */
  describedBy?: string
}

/**
 * 身分組多選。不能選的身分組（@everyone、整合服務管理）停用並說明原因；
 * 已選但不在選項裡的 ID（身分組已被刪除）仍列出，讓管理員取消勾選。
 */
export function RoleMultiSelect({ legend, options, value, onChange, disabled, describedBy }: Props) {
  const known = new Set(options?.map((o) => o.id) ?? [])
  const missing = options === null ? [] : value.filter((id) => !known.has(id))
  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? (value.includes(id) ? value : [...value, id]) : value.filter((x) => x !== id))

  return (
    <fieldset aria-describedby={describedBy} className="min-w-0">
      <legend className="mb-1 block text-sm text-gray-600 dark:text-gray-400">{legend}</legend>
      {options === null ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">載入中…</p>
      ) : (
        <ul className="max-h-48 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 space-y-1">
          {missing.map((id) => (
            <li key={id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled={disabled} onChange={() => toggle(id, false)} />
                <span className="break-all">{id}（身分組已被刪除，取消勾選即可移除）</span>
              </label>
            </li>
          ))}
          {options.map((o) => {
            const checked = value.includes(o.id)
            const blocked = o.disabled_reason !== null && !checked
            return (
              <li key={o.id}>
                <label className={`flex items-start gap-2 text-sm ${blocked ? "opacity-60" : ""}`}>
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={disabled || blocked}
                    onChange={(e) => toggle(o.id, e.target.checked)}
                  />
                  <span className="min-w-0 break-words">
                    @ {o.name}
                    {o.disabled_reason && (
                      <span className="block text-gray-600 dark:text-gray-400">{o.disabled_reason}</span>
                    )}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </fieldset>
  )
}
