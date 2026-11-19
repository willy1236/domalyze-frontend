"use client"

import { useChannel } from "@/components/dashboard/channel/channel-access-guard"
import { NotAvailable } from "@/components/dashboard/channel/not-available"
import { forwardAccessNotice } from "@/lib/dashboard-channel"
import { DOMALYZE_ACCOUNT_URL } from "@/lib/dashboard-login"

export default function ChannelForwardPage() {
  const { forward_access } = useChannel()
  const notice = forwardAccessNotice(forward_access)
  if (notice === null) return <NotAvailable title="轉發 Discord" />
  return (
    <section>
      <h2 className="text-2xl font-serif mb-6">轉發 Discord</h2>
      <div className="border border-champagne/30 px-4 py-6">
        <p className="font-medium mb-2">{notice.title}</p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{notice.body}</p>
        <a
          href={DOMALYZE_ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-champagne underline underline-offset-4"
        >
          前往析域帳號頁
        </a>
      </div>
    </section>
  )
}
