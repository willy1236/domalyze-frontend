import type { ReactNode } from "react"
import Link from "next/link"

/** 登入頁與選擇畫面共用的外框：品牌標誌與置中的窄欄 */
export function LoginShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-10 text-lg font-serif tracking-widest text-primary uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/xingyu-mark.svg" alt="" width={28} height={28} className="w-7 h-7 dark:brightness-[1.3]" /> Xingyu
        </Link>
        <h1 className="text-2xl font-serif text-center mb-8">{title}</h1>
        {children}
      </div>
    </div>
  )
}

export function LoginNoticeBox({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="border border-champagne/30 px-4 py-3 mb-6 text-sm">
      {children}
    </div>
  )
}
