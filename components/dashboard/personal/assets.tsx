import { POINT_LABELS, type PersonalDiscord, type PersonalOverview } from "@/lib/dashboard-personal"
import { PersonalSection } from "./personal-section"

function DiscordAssets({ discord, showName }: { discord: PersonalDiscord; showName: boolean }) {
  const { points, pet } = discord
  return (
    <div className="grid gap-3 text-sm">
      {showName && <h3 className="font-medium truncate">{discord.name}</h3>}
      <dl className="grid grid-cols-3 gap-2">
        {POINT_LABELS.map(([key, label]) => (
          <div key={key} className="min-w-0">
            <dt className="text-gray-500 dark:text-gray-400 truncate">{label}</dt>
            <dd className="tabular-nums">{points[key]}</dd>
          </div>
        ))}
      </dl>
      <p>
        <span className="text-gray-500 dark:text-gray-400">寵物：</span>
        {pet ? `${pet.name}（${pet.species}）` : "沒有寵物"}
      </p>
    </div>
  )
}

/** 資產區塊：積分與寵物，依 Discord 分開顯示 */
export function AssetsSection({ overview }: { overview: PersonalOverview }) {
  const showName = overview.discords.length > 1
  return (
    <PersonalSection title="積分與寵物">
      <div className="grid gap-6 sm:grid-cols-2">
        {overview.discords.map((d) => (
          <DiscordAssets key={d.id} discord={d} showName={showName} />
        ))}
      </div>
    </PersonalSection>
  )
}
