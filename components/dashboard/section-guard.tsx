"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGuildSections } from "@/components/dashboard/guild-sections"
import {
  canAccess,
  firstSection,
  sectionHref,
  type NavItemDef,
  type SectionInfo,
  type SectionKey,
} from "@/lib/dashboard-sections"

interface SectionGuardProps {
  section: SectionKey
  /** 沒有權限時不提示、直接導走；伺服器頁預設落點（通知）用，因為使用者並沒有主動要求這個區塊 */
  silent?: boolean
  children: React.ReactNode
}

export type GuardState = "failed" | "loading" | "allowed" | "denied"

/** 守衛目前該呈現的狀態；failed 優先於 loading（載入失敗時 sections 仍是 null）。 */
export function guardState(sections: readonly SectionInfo[] | null, failed: boolean, section: SectionKey): GuardState {
  if (failed) return "failed"
  if (sections === null) return "loading"
  return canAccess(sections, section) ? "allowed" : "denied"
}

export interface DenyPlan {
  /** 是否跳出提示 */
  alert: boolean
  /** 導向的區塊；沒有可去的區塊為 null，停在說明 */
  target: NavItemDef | null
}

/** 沒有權限時的處置：silent 不提示；導向第一個有權限的區塊。 */
export function denyPlan(sections: readonly SectionInfo[], silent: boolean): DenyPlan {
  return { alert: !silent, target: firstSection(sections) }
}

/**
 * 包在各區塊頁外：有權限才渲染 children（所以區塊的資料請求要寫在 children 裡，不會在沒權限時送出）；
 * 沒有權限就提示並導到第一個有權限的區塊，連一個都沒有就停在說明。
 */
export function SectionGuard({ section, silent = false, children }: SectionGuardProps) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { sections, failed, reload } = useGuildSections()
  const state = guardState(sections, failed, section)
  const denied = state === "denied"
  const target = sections !== null ? firstSection(sections) : null
  const handled = useRef(false)

  useEffect(() => {
    if (!denied || handled.current) return
    handled.current = true
    const plan = denyPlan(sections ?? [], silent)
    if (plan.alert) window.alert("你沒有這個區塊的權限。")
    if (plan.target) router.replace(sectionHref(id, plan.target))
  }, [denied, silent, sections, id, router])

  if (state === "failed") {
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
  if (state === "loading") return <p className="text-gray-600 dark:text-gray-400">載入中…</p>
  if (state === "denied") {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        {target ? "你沒有這個區塊的權限，正在前往其他區塊…" : "你沒有這個區塊的權限，目前也沒有其他可使用的區塊。"}
      </p>
    )
  }
  return <>{children}</>
}
