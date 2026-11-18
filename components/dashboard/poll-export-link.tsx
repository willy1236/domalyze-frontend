"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { downloadPollExport, exportErrorText } from "@/lib/dashboard-poll-export"
import type { PollDetail } from "@/lib/dashboard-polls"
import { WarnIcon } from "./icons"

/** 匯出 CSV 按鈕；看不到票數時不顯示。 */
export function PollExportLink({ guildId, detail }: { guildId: string; detail: PollDetail; onChanged: () => Promise<void> | void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!detail.counts) return null

  async function run() {
    setBusy(true)
    setError(null)
    try {
      await downloadPollExport(guildId, detail.id, detail.title)
    } catch (e) {
      if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("poll export failed", e)
        setError(exportErrorText(e instanceof DashboardApiError ? e.code : null))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={() => void run()}>
          匯出 CSV
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-red-700 dark:text-red-300">
          <WarnIcon className="mt-0.5 shrink-0" width={15} height={15} />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
