import { LinkButton } from "@/components/ui"
import { type LoginProvider, forgetNext, loginProviderOrder, rememberNext } from "@/lib/dashboard-login"

const LABELS: Record<LoginProvider, string> = {
  domalyze: "以析域帳號登入",
  discord: "以 Discord 登入",
  twitch: "以 Twitch 登入",
}

/** 登入按鈕列：順序與第一顆的主要樣式由 loginProviderOrder 決定；href 為 undefined 時（水合前）按鈕沒有連結 */
export function LoginProviders({ next, href }: { next: string; href: (provider: LoginProvider) => string | undefined }) {
  return (
    <div className="flex flex-col gap-3">
      {loginProviderOrder(next).map((provider, index) => (
        <div key={provider} className="contents">
          <LinkButton
            variant={index === 0 ? "primary" : "outline"}
            className={index === 0 ? "block w-full text-center px-4 py-3" : "block w-full text-center py-3"}
            href={href(provider)}
            onClick={provider === "domalyze" ? () => rememberNext(next) : forgetNext}
          >
            {LABELS[provider]}
          </LinkButton>
          {provider === "domalyze" && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              析域帳號能使用後台的完整功能，一次管理 Discord 伺服器與 Twitch 頻道。用 Discord 或 Twitch 登入，只能管理該平台的部分。
            </p>
          )}
          {index === 0 && (
            <div role="separator" className="flex items-center gap-3 my-1 text-xs text-gray-500 dark:text-gray-400">
              <span aria-hidden className="h-px flex-1 bg-champagne/30" />
              或
              <span aria-hidden className="h-px flex-1 bg-champagne/30" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
