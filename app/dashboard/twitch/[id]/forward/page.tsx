"use client"

import { Button } from "@/components/ui"
import { useChannel } from "@/components/dashboard/channel/channel-access-guard"
import { ForwardForm, useForwardSetting } from "@/components/dashboard/channel/forward-form"
import { forwardAccessNotice } from "@/lib/dashboard-channel"
import { DOMALYZE_ACCOUNT_URL } from "@/lib/dashboard-login"

/** 頻道事件轉發到 Discord：開台、下播、追隨、訂閱、續訂、贈訂、Raid、兌換、預測結果。 */
export default function ChannelForwardPage() {
  const { id, forward_access } = useChannel()
  const notice = forwardAccessNotice(forward_access)
  const { data, error, reload, setData } = useForwardSetting(id)
  return (
    <section>
      <h2 className="text-2xl font-serif mb-2">轉發 Discord</h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        把開台、下播、追隨、訂閱、續訂、贈訂、Raid、兌換與預測結果發到你指定的 Discord 頻道；沒有設定就不會轉發。
      </p>
      {notice !== null && (
        <div className="mb-6 border border-champagne/30 px-4 py-6">
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
      )}
      {error ? (
        <div className="border border-champagne/30 px-4 py-6 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">無法載入，請稍後再試。</p>
          <Button type="button" onClick={() => void reload()}>
            重新載入
          </Button>
        </div>
      ) : data === null ? (
        <div className="min-h-[10vh]" aria-busy="true" />
      ) : (
        <ForwardForm channelId={id} setting={data} onSaved={setData} />
      )}
    </section>
  )
}
