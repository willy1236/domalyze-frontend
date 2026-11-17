import { DOMALYZE_ACCOUNT_URL } from "@/lib/dashboard-login"
import { type PersonalDiscord, type PersonalOverview, accountLabel } from "@/lib/dashboard-personal"
import { LinkAccountEntry } from "./link-entry"

function DiscordChip({ discord }: { discord: PersonalDiscord }) {
  return (
    <li className="flex items-center gap-2 min-w-0 border border-champagne/25 py-1 pl-1 pr-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={discord.avatar_url} alt="" width={24} height={24} className="w-6 h-6 rounded-full shrink-0" />
      <span className="min-w-0 truncate">{discord.name}</span>
      {discord.current && <span className="text-xs tracking-widest text-champagne shrink-0">目前</span>}
    </li>
  )
}

/** 個人區頂部：析域帳號（或目前的 Discord）與連結的 Discord；沒有析域帳號時附連結入口 */
export function AccountSection({ overview }: { overview: PersonalOverview }) {
  const { account, partial, discords } = overview
  const current = discords.find((d) => d.current) ?? discords[0]
  return (
    <section aria-labelledby="personal-title" className="grid gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5 min-w-0">
          {current && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.avatar_url}
              alt=""
              width={72}
              height={72}
              className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full shrink-0 ring-1 ring-champagne/40 ring-offset-4 ring-offset-background-light dark:ring-offset-background-dark"
            />
          )}
          <div className="min-w-0">
            <h1 id="personal-title" className="text-2xl sm:text-3xl font-serif truncate">
              {account ? accountLabel(account) : (current?.name ?? "我的")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {account ? (
                <a
                  href={DOMALYZE_ACCOUNT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-champagne underline underline-offset-4 hover:opacity-80"
                >
                  管理析域帳號
                </a>
              ) : (
                "尚未連結析域帳號"
              )}
            </p>
          </div>
        </div>

        <div className="text-sm min-w-0 sm:max-w-[50%]">
          <h2 className="sr-only">Discord</h2>
          <ul className="flex flex-wrap gap-2 sm:justify-end">
            {discords.map((d) => (
              <DiscordChip key={d.id} discord={d} />
            ))}
          </ul>
          {partial && (
            <p role="status" className="mt-2 text-gray-500 dark:text-gray-400 sm:text-right">
              其他 Discord 帳號的資料暫時無法載入。
            </p>
          )}
        </div>
      </div>

      {!account && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-prose">
          連結後可以一起查看其他 Discord 的資料，並使用歌單、雲端資料夾共用、NetBird 與公開頁。<LinkAccountEntry />
        </p>
      )}
    </section>
  )
}
