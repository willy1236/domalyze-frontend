"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGuildSections } from "@/components/dashboard/guild-sections"
import { firstSection, sectionHref, type SectionKey } from "@/lib/dashboard-sections"

interface SectionGuardProps {
  section: SectionKey
  /** 沒有權限時不提示、直接導走；伺服器頁預設落點（通知）用，因為使用者並沒有主動要求這個區塊 */
  silent?: boolean
  children: React.ReactNode
}

/**
 * 包在各區塊頁外：有權限才渲染 children（所以區塊的資料請求要寫在 children 裡，不會在沒權限時送出）；
 * 沒有權限就提示並導到第一個有權限的區塊，連一個都沒有就停在說明。
 */
export function SectionGuard({ section, silent = false, children }: SectionGuardProps) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { sections, failed, can, reload } = useGuildSections()
  const denied = sections !== null && !can(section)
  const target = sections !== null ? firstSection(sections) : null
  const handled = useRef(false)

  useEffect(() => {
    if (!denied || handled.current) return
    handled.current = true
    if (!silent) window.alert("你沒有這個區塊的權限。")
    if (target) router.replace(sectionHref(id, target))
  }, [denied, silent, target, id, router])

  if (failed) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        無法載入區塊權限，請稍後
        <button type="button" className="underline mx-1" onClick={reload}>
          重試
        </button>
        。
      </p>
    )
  }
  if (sections === null) return <p className="text-gray-600 dark:text-gray-400">載入中…</p>
  if (denied) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        {target ? "你沒有這個區塊的權限，正在前往其他區塊…" : "你沒有這個區塊的權限，目前也沒有其他可使用的區塊。"}
      </p>
    )
  }
  return <>{children}</>
}
