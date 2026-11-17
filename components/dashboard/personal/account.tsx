import { type PersonalOverview, accountLabel } from "@/lib/dashboard-personal"
import { DiscordIdentity } from "./discord-identity"
import { LinkAccountEntry } from "./link-entry"
import { PersonalSection } from "./personal-section"

/** 帳號區塊：域民代號與連結的 Discord；沒有析域帳號時只有目前的 Discord 與連結入口 */
export function AccountSection({ overview }: { overview: PersonalOverview }) {
  const { account, partial, discords } = overview
  return (
    <PersonalSection title="帳號">
      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400 mb-1">析域帳號</dt>
          {account ? (
            <dd>{accountLabel(account)}</dd>
          ) : (
            <dd>
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                連結後可以一起查看其他 Discord 的資料，並使用歌單、雲端資料夾共用、NetBird 與公開頁。
              </p>
              <LinkAccountEntry />
            </dd>
          )}
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400 mb-2">Discord</dt>
          <dd>
            <ul className="grid gap-2">
              {discords.map((d) => (
                <li key={d.id}>
                  <DiscordIdentity discord={d} />
                </li>
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
