import { type PersonalDiscord, type PersonalOverview, accountLabel } from "@/lib/dashboard-personal"
import { LinkAccountEntry } from "./link-entry"
import { PersonalSection } from "./personal-section"

function DiscordRow({ discord }: { discord: PersonalDiscord }) {
  return (
    <li className="flex items-center gap-3 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={discord.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full shrink-0" />
      <span className="min-w-0 truncate">{discord.name}</span>
      {discord.current && <span className="text-xs tracking-widest text-champagne shrink-0">目前</span>}
    </li>
  )
}

/** 帳號區塊：域民代號與連結的 Discord；沒有析域帳號時只有目前的 Discord 與連結入口 */
export function AccountSection({ overview }: { overview: PersonalOverview }) {
  const { account, partial, discords } = overview
  return (
    <PersonalSection title="帳號">
      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400 mb-1">析域帳號</dt>
          <dd>{account ? accountLabel(account) : <LinkAccountEntry />}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400 mb-2">Discord</dt>
          <dd>
            <ul className="grid gap-2">
              {discords.map((d) => (
                <DiscordRow key={d.id} discord={d} />
              ))}
            </ul>
            {partial && (
              <p role="status" className="mt-2 text-gray-500 dark:text-gray-400">
                其他 Discord 帳號的資料暫時無法載入。
              </p>
            )}
          </dd>
        </div>
      </dl>
    </PersonalSection>
  )
}
