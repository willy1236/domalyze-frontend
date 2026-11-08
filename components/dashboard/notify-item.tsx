import type { ReactNode } from "react"
import type { NotifyItem } from "@/lib/dashboard-notifies"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm min-w-0">
      <dt className="text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function Invalid({ reason }: { reason: string }) {
  return <span className="block text-xs text-red-500 dark:text-red-400">失效：{reason}</span>
}

/** 唯讀的一筆通知；T-06、T-07 之後在這張卡片外加操作按鈕 */
export function NotifyItemCard({ item, actions }: { item: NotifyItem; actions?: ReactNode }) {
  const { channel, role, message, account } = item
  const invalid = channel.invalid !== null || (role?.invalid ?? null) !== null
  return (
    <li className={`border px-4 py-3 ${invalid ? "border-red-500/50" : "border-champagne/30"}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-serif break-words">{item.name}</h3>
          {account && (
            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
              {account.display_name}（{account.username}）
            </p>
          )}
        </div>
        {actions}
      </div>
      <dl className="grid gap-1">
        <Field label="頻道">
          {channel.name ? `#${channel.name}` : <span className="break-all">{channel.id}</span>}
          {channel.invalid && <Invalid reason={channel.invalid} />}
        </Field>
        {role !== undefined && (
          <Field label="身分組">
            {role === null ? (
              "未設定"
            ) : (
              <>
                {role.name ? `@${role.name}` : <span className="break-all">{role.id}</span>}
                {role.invalid && <Invalid reason={role.invalid} />}
              </>
            )}
          </Field>
        )}
        {message !== undefined && (
          <Field label="自訂文字">
            {message ? <span className="whitespace-pre-wrap">{message}</span> : "未設定"}
          </Field>
        )}
      </dl>
    </li>
  )
}
