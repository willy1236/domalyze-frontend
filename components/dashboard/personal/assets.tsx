import { POINT_LABELS, type PersonalDiscord, type PersonalOverview } from "@/lib/dashboard-personal"
import { DiscordIdentity } from "./discord-identity"
import { PersonalSection } from "./personal-section"

// 窄螢幕：Discord 與寵物各佔一整列、三種積分並排；寬螢幕：一個 Discord 一列，欄位對齊上方表頭
const ROW = "grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_minmax(0,1.4fr)] sm:items-center"

function DiscordAssets({ discord }: { discord: PersonalDiscord }) {
  const { points, pet } = discord
  return (
    <li className={`${ROW} py-4 border-t border-champagne/15`}>
      <div className="col-span-3 sm:col-span-1 min-w-0">
        <DiscordIdentity discord={discord} />
      </div>
      {POINT_LABELS.map(([key, label]) => (
        <dl key={key} className="min-w-0">
          <dt className="sm:sr-only text-xs text-gray-500 dark:text-gray-400 truncate">{label}</dt>
          <dd className="text-xl font-serif tabular-nums truncate">{points[key].toLocaleString("zh-TW")}</dd>
        </dl>
      ))}
      <dl className="col-span-3 sm:col-span-1 min-w-0">
        <dt className="sm:sr-only text-xs text-gray-500 dark:text-gray-400">寵物</dt>
        <dd className="truncate">
          {pet ? (
            <>
              {pet.name}
              <span className="text-gray-500 dark:text-gray-400">（{pet.species}）</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">沒有寵物</span>
          )}
        </dd>
      </dl>
    </li>
  )
}

/** 資產區塊：積分與寵物，一個 Discord 一列 */
export function AssetsSection({ overview }: { overview: PersonalOverview }) {
  return (
    <PersonalSection title="積分與寵物">
      <div aria-hidden className={`${ROW} hidden sm:grid pb-2 text-xs text-gray-500 dark:text-gray-400`}>
        <span>Discord</span>
        {POINT_LABELS.map(([key, label]) => (
          <span key={key} className="truncate">
            {label}
          </span>
        ))}
        <span>寵物</span>
      </div>
      <ul>
        {overview.discords.map((d) => (
          <DiscordAssets key={d.id} discord={d} />
        ))}
      </ul>
    </PersonalSection>
  )
}
