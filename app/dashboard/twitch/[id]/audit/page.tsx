"use client"

import { useCallback, useState } from "react"
import { AuditList } from "@/components/dashboard/audit-list"
import { useChannel, useChannelError } from "@/components/dashboard/channel/channel-access-guard"
import { fetchChannelAudit } from "@/lib/dashboard-channel"
import { useLoad } from "@/lib/use-load"

/** 頻道的修改紀錄：誰、什麼時間、從後台或聊天室改了什麼；實況主與 mod 都看得到。 */
export default function ChannelAuditPage() {
  const { id } = useChannel()
  const [page, setPage] = useState(1)
  const leaveIfForbidden = useChannelError()
  const fetcher = useCallback((signal: AbortSignal) => fetchChannelAudit(id, page, signal), [id, page])
  const { data, failed } = useLoad(fetcher, { keepPrevious: true, onError: leaveIfForbidden })
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-serif mb-2">修改紀錄</h2>
      {failed ? (
        <p className="text-gray-500 dark:text-gray-400">無法載入修改紀錄，請稍後重新整理頁面再試。</p>
      ) : data === null ? (
        <div className="min-h-[10vh]" aria-busy="true" />
      ) : (
        <AuditList data={data} onPage={setPage} />
      )}
    </section>
  )
}
