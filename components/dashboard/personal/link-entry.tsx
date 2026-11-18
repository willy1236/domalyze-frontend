"use client"

import { reportLinkClick } from "@/lib/dashboard-personal"
import { DOMALYZE_ACCOUNT_URL } from "@/lib/dashboard-login"

/** 前往析域帳號頁連結 Discord 的入口，另開分頁 */
export function LinkAccountEntry({ children = "連結析域帳號" }: { children?: React.ReactNode }) {
  return (
    <a
      href={DOMALYZE_ACCOUNT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={reportLinkClick}
      className="text-champagne underline underline-offset-4 hover:opacity-80"
    >
      {children}
    </a>
  )
}
