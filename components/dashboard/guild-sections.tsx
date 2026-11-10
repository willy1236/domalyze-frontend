"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { canAccess, fetchSections, type SectionInfo, type SectionKey } from "@/lib/dashboard-sections"

interface GuildSections {
  /** 載入完成前為 null */
  sections: SectionInfo[] | null
  /** 載入失敗（非權限類錯誤）；權限類錯誤由 dashboardFetch 直接導回清單 */
  failed: boolean
  can: (section: SectionKey, action?: string) => boolean
  reload: () => void
}

const GuildSectionsContext = createContext<GuildSections | null>(null)

/** 載入目前使用者在這個伺服器的區塊權限，供導覽與各區塊頁使用。 */
export function GuildSectionsProvider({ guildId, children }: { guildId: string; children: React.ReactNode }) {
  const [sections, setSections] = useState<SectionInfo[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setSections(null)
    setFailed(false)
    fetchSections(guildId, controller.signal)
      .then((res) => setSections(res.sections))
      .catch((e) => {
        if (controller.signal.aborted) return
        console.error("load sections failed", e)
        setFailed(true)
      })
    return () => controller.abort()
  }, [guildId, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const value = useMemo<GuildSections>(
    () => ({
      sections,
      failed,
      can: (section, action) => sections !== null && canAccess(sections, section, action),
      reload,
    }),
    [sections, failed, reload],
  )
  return <GuildSectionsContext.Provider value={value}>{children}</GuildSectionsContext.Provider>
}

export function useGuildSections(): GuildSections {
  const ctx = useContext(GuildSectionsContext)
  if (!ctx) throw new Error("useGuildSections 必須在 GuildSectionsProvider 內使用")
  return ctx
}
