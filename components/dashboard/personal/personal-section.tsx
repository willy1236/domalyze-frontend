import type { ReactNode } from "react"
import { LinkAccountEntry } from "./link-entry"

/** 個人區各區塊的外框；locked 時只顯示需要析域帳號的說明與連結入口 */
export function PersonalSection({
  title,
  locked = false,
  children,
}: {
  title: string
  locked?: boolean
  children?: ReactNode
}) {
  return (
    <section className="border border-champagne/30 px-4 py-5 sm:px-6">
      <h2 className="text-lg font-serif mb-4">{title}</h2>
      {locked ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          連結析域帳號後可用。<LinkAccountEntry />
        </p>
      ) : (
        children
      )}
    </section>
  )
}
