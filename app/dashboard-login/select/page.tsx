"use client"

import { useCallback, useState } from "react"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import { forgetNext, loginPageUrl, sanitizeNext, selectErrorAction } from "@/lib/dashboard-login"
import { useLoad } from "@/lib/use-load"
import { LoginNoticeBox, LoginShell } from "../login-shell"

interface Candidate {
  id: string
  name: string
  /** 取不到 Discord 使用者時為 null，只顯示 Discord ID */
  avatar_url: string | null
}

interface Candidates {
  candidates: Candidate[]
}

function currentNext(): string {
  return sanitizeNext(new URLSearchParams(window.location.search).get("next"))
}

/** 待選資料已失效（逾時或服務重啟）：回到登入頁重新開始 */
function backToLogin(): void {
  window.location.href = loginPageUrl(currentNext(), "domalyze_expired")
}

function errorAction(e: unknown) {
  return selectErrorAction(e instanceof DashboardApiError ? e.code : null)
}

function CandidateAvatar({ candidate }: { candidate: Candidate }) {
  if (candidate.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={candidate.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full shrink-0" />
  }
  return <span aria-hidden className="w-10 h-10 rounded-full shrink-0 bg-champagne/20" />
}

export default function DashboardLoginSelectPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetcher = useCallback(
    (signal: AbortSignal) => dashboardFetch<Candidates>("/dashboard/login/candidates", {}, { signal }),
    [],
  )
  const { data, failed, reload } = useLoad(fetcher, {
    onError: (e) => {
      if (errorAction(e) === "restart") backToLogin()
    },
  })

  async function choose(candidate: Candidate) {
    setBusy(true)
    setError(null)
    try {
      const res = await dashboardFetch<{ redirect: string }>("/dashboard/login/select", {
        method: "POST",
        json: { discord_user_id: candidate.id },
      })
      forgetNext()
      window.location.assign(res.redirect)
    } catch (e) {
      setBusy(false)
      const action = errorAction(e)
      if (action === "restart") {
        backToLogin()
      } else if (action === "reload") {
        setError("這個 Discord 已不在可選的清單中，請重新選擇。")
        void reload()
      } else {
        setError("登入失敗，請稍後再試。")
      }
    }
  }

  return (
    <LoginShell title="選擇 Discord 帳號">
      {error && <LoginNoticeBox>{error}</LoginNoticeBox>}
      {failed && !error && <LoginNoticeBox>無法載入帳號清單，請稍後重新整理頁面再試。</LoginNoticeBox>}
      {data && (
        <ul className="flex flex-col gap-3">
          {data.candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => choose(c)}
                className="w-full flex items-center gap-3 border border-champagne/30 px-4 py-3 text-left not-disabled:hover:border-champagne transition-colors disabled:opacity-60"
              >
                <CandidateAvatar candidate={c} />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </LoginShell>
  )
}
