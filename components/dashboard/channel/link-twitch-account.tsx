"use client"

import { LinkButton } from "@/components/ui"
import { linkTwitchNote } from "@/lib/dashboard-channel"
import { DOMALYZE_LINK_TWITCH_URL } from "@/lib/dashboard-login"
import { useDashboardUser } from "@/lib/dashboard-user"

/** 到 auth server（析域帳號）連結 Twitch 帳號的入口與依登入方式而異的說明，另開分頁。 */
export function LinkTwitchAccount({ label = "連結更多 Twitch 帳號" }: { label?: string }) {
  const loginMethod = useDashboardUser()?.login_method
  return (
    <div className="flex flex-col items-start gap-2">
      <LinkButton variant="outline" href={DOMALYZE_LINK_TWITCH_URL} target="_blank" rel="noopener noreferrer">
        {label}
      </LinkButton>
      <p className="text-sm text-gray-500 dark:text-gray-400">{linkTwitchNote(loginMethod)}</p>
    </div>
  )
}
