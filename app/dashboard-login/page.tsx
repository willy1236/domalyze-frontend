"use client"

import { useEffect, useState } from "react"
import { LinkButton } from "@/components/ui"
import {
  DOMALYZE_ACCOUNT_URL,
  LOGIN_NOTICES,
  type LoginNotice,
  type LoginProvider,
  forgetNext,
  isLoginNotice,
  providerLoginUrl,
  rememberNext,
  resolveNext,
} from "@/lib/dashboard-login"
import { LoginNoticeBox, LoginShell } from "./login-shell"

const PROVIDER_CLASS = "block w-full text-center py-3"

export default function DashboardLoginPage() {
  const [next, setNext] = useState("/dashboard")
  const [notice, setNotice] = useState<LoginNotice | null>(null)
  // 登入入口要帶前端的 origin；等 hydration 後才有，之前按鈕沒有連結
  const [origin, setOrigin] = useState<string | null>(null)

  // 網址參數只在瀏覽器讀得到；讀完 notice 後從網址移除，重新整理時不再顯示
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resolved = resolveNext(params)
    const key = params.get("notice")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNext(resolved)
    setOrigin(window.location.origin)
    if (isLoginNotice(key)) setNotice(key)
    if (key !== null || params.get("next") !== resolved) {
      window.history.replaceState(null, "", `${window.location.pathname}?${new URLSearchParams({ next: resolved })}`)
    }
  }, [])

  function href(provider: LoginProvider): string | undefined {
    return origin === null ? undefined : providerLoginUrl(provider, next, origin)
  }

  return (
    <LoginShell title="登入">
      {notice && (
        <LoginNoticeBox>
          <p>{LOGIN_NOTICES[notice]}</p>
          {notice === "domalyze_no_discord" && (
            <a
              href={DOMALYZE_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-champagne underline underline-offset-4"
            >
              前往析域帳號頁
            </a>
          )}
        </LoginNoticeBox>
      )}
      <div className="flex flex-col gap-3">
        <LinkButton
          variant="primary"
          className="block w-full text-center px-4 py-3"
          href={href("domalyze")}
          onClick={() => rememberNext(next)}
        >
          以析域帳號登入
        </LinkButton>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          析域帳號能使用後台的完整功能，一次管理 Discord 伺服器與 Twitch 頻道。用 Discord 或 Twitch 登入，只能管理該平台的部分。
        </p>
        <div role="separator" className="flex items-center gap-3 my-1 text-xs text-gray-500 dark:text-gray-400">
          <span aria-hidden className="h-px flex-1 bg-champagne/30" />
          或
          <span aria-hidden className="h-px flex-1 bg-champagne/30" />
        </div>
        <LinkButton variant="outline" className={PROVIDER_CLASS} href={href("discord")} onClick={forgetNext}>
          以 Discord 登入
        </LinkButton>
        <LinkButton variant="outline" className={PROVIDER_CLASS} href={href("twitch")} onClick={forgetNext}>
          以 Twitch 登入
        </LinkButton>
      </div>
    </LoginShell>
  )
}
