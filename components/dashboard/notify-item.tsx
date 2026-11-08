import type { ReactNode } from "react"
import type { NotifyItem } from "@/lib/dashboard-notifies"
import { ArrowIcon, AtIcon, HashIcon, WarnIcon } from "./icons"

const muted = "text-gray-600 dark:text-gray-400"

function Problem({ reason }: { reason: string }) {
  return (
    <p className="mt-1 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
      <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
      <span>{reason}</span>
    </p>
  )
}

/** 一筆通知的一行：種類在左，「頻道 → 身分組」的投遞路徑與自訂文字在右。T-06、T-07 從 actions 放操作按鈕。 */
export function NotifyRow({ item, actions }: { item: NotifyItem; actions?: ReactNode }) {
  const { channel, role, message } = item
  return (
    <li className="py-5 flex items-start gap-4">
      <div className="min-w-0 flex-1 grid gap-x-8 gap-y-2 sm:grid-cols-[11rem_1fr]">
        <h3 className="font-serif text-lg leading-snug text-primary dark:text-silver break-words">{item.name}</h3>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <HashIcon className={`shrink-0 ${muted}`} />
              {channel.name ? (
                <span className="break-all">{channel.name}</span>
              ) : (
                <span className={`break-all ${muted}`}>{channel.id}</span>
              )}
            </span>
            {role !== undefined && (
              <>
                <ArrowIcon className={`shrink-0 ${muted}`} width={14} height={14} />
                {role === null ? (
                  <span className={muted}>不 tag 身分組</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <AtIcon className={`shrink-0 ${muted}`} />
                    <span className={`break-all ${role.name ? "" : muted}`}>{role.name ?? role.id}</span>
                  </span>
                )}
              </>
            )}
          </p>
          {channel.invalid && <Problem reason={`頻道：${channel.invalid}`} />}
          {role?.invalid && <Problem reason={`身分組：${role.invalid}`} />}

          {message !== undefined &&
            (message ? (
              <p className="mt-3 rounded-md bg-primary/5 dark:bg-champagne/5 px-3 py-2 text-sm whitespace-pre-wrap break-words">
                {message}
              </p>
            ) : (
              <p className={`mt-2 text-sm ${muted}`}>使用預設文字</p>
            ))}
        </div>
      </div>
      {actions}
    </li>
  )
}
