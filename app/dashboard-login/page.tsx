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
        <LinkButton variant="outline" className={PROVIDER_CLASS} href={href("discord")} onClick={forgetNext}>
          以 Discord 登入
        </LinkButton>
        <LinkButton
          variant="outline"
          className={PROVIDER_CLASS}
          href={href("domalyze")}
          onClick={() => rememberNext(next)}
        >
          以析域帳號登入
        </LinkButton>
      </div>
    </LoginShell>
  )
}
