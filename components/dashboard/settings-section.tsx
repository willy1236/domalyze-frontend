"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { participantLabel } from "@/lib/dashboard-giveaways"
import {
  fetchSettings,
  formatMinutes,
  parseSettingsProblem,
  saveSettings,
  settingValues,
  type LeaderboardRow,
  type SettingValues,
  type SettingsResponse,
} from "@/lib/dashboard-settings"
import { useLoad } from "@/lib/use-load"
import { ConflictNotice, type ConflictValues } from "./conflict-notice"

const muted = "text-gray-600 dark:text-gray-400"
const linkClass =
  "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"

const toConflictValues = (v: SettingValues): ConflictValues => ({ voice_time_counter: v.voice_time_counter ? "true" : "false" })
const formatConflictValue = (_field: string, value: string | null) => (value === "true" ? "開啟" : "關閉")

function Leaderboard({ rows, counting }: { rows: LeaderboardRow[]; counting: boolean }) {
  return (
    <div className="mt-6">
      <h3 className="font-serif text-lg text-primary dark:text-silver">語音時數排行榜（前 20 名）</h3>
      {!counting && (
        <p className={`mt-1 text-sm ${muted}`}>目前沒有在統計語音時數，以下是關閉前累計的排行，不會再增加。</p>
      )}
      {rows.length === 0 ? (
        <p className={`mt-3 ${muted}`}>
          {counting ? "還沒有語音時數紀錄。成員在語音頻道待一段時間後，這裡會出現排行。" : "沒有語音時數紀錄。"}
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-primary/10 dark:divide-champagne/15">
          {rows.map((row, i) => (
            <li key={row.member.id} className="flex items-center gap-3 py-2">
              <span className={`w-7 shrink-0 text-right tabular-nums ${muted}`}>{i + 1}</span>
              <span className="inline-flex items-center gap-2 min-w-0 flex-1">
                {row.member.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.member.avatar_url} alt="" width={20} height={20} className="w-5 h-5 rounded-full shrink-0" />
                )}
                <span className={`break-all ${row.member.left ? muted : ""}`}>{participantLabel(row.member)}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatMinutes(row.minutes)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function VoiceTimeSetting({
  guildId,
  settings,
  onSaved,
}: {
  guildId: string
  settings: SettingsResponse
  onSaved: (next: SettingsResponse) => void
}) {
  const [busy, setBusy] = useState(false)
  const [conflict, setConflict] = useState<{ current: SettingValues; mine: SettingValues } | null>(null)

  const save = async (mine: SettingValues, original: SettingValues) => {
    setBusy(true)
    try {
      onSaved(await saveSettings(guildId, mine, original))
      setConflict(null)
    } catch (e) {
      const problem = parseSettingsProblem(e)
      if (problem) {
        setConflict({ current: problem.current, mine })
      } else if (!(e instanceof DashboardApiError && e.handled)) {
        console.error("save settings failed", e)
        window.alert("儲存失敗，請稍後再試。")
      }
    } finally {
      setBusy(false)
    }
  }

  const on = settings.voice_time_counter
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-primary dark:text-silver">語音時數統計</h3>
          <p className={`text-sm ${muted}`}>
            開啟後，成員在語音頻道（不含 AFK 頻道、未拒聽或靜音時）每分鐘累計一分鐘；立即生效，不需要重啟 bot。
          </p>
        </div>
        <Button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={busy}
          onClick={() => void save({ voice_time_counter: !on }, settingValues(settings))}
        >
          {on ? "關閉統計" : "開啟統計"}
        </Button>
      </div>
      <p className={`mt-2 text-sm ${on ? "text-green-700 dark:text-green-300" : muted}`}>
        目前：{on ? "統計中" : "未統計"}
      </p>
      {conflict && (
        <div className="mt-4">
          <ConflictNotice
            subject="這項設定"
            current={toConflictValues(conflict.current)}
            mine={toConflictValues(conflict.mine)}
            format={formatConflictValue}
            busy={busy}
            onOverwrite={(current) => void save(conflict.mine, { voice_time_counter: current.voice_time_counter === "true" })}
          />
        </div>
      )}
    </div>
  )
}

/**
 * 基本設定：語音時數統計開關與排行榜。
 * `extra` 是插槽，放在語音時數之後（B-02 放自動禁言表單），拿到目前設定、儲存後的更新函式與重新載入函式。
 */
export function SettingsSection({
  guildId,
  extra,
}: {
  guildId: string
  extra?: (settings: SettingsResponse, update: (next: SettingsResponse) => void, reload: () => Promise<void>) => ReactNode
}) {
  const fetcher = useCallback((signal: AbortSignal) => fetchSettings(guildId, signal), [guildId])
  const { data, setData, failed, reload } = useLoad(fetcher)

  return (
    <section id="settings" className="scroll-mt-6">
      <header className="border-b border-primary/20 dark:border-champagne/25 pb-2">
        <h2 className="font-serif text-2xl text-primary dark:text-silver">基本設定</h2>
      </header>

      {failed && (
        <p className={`py-8 ${muted}`}>
          無法載入基本設定，請稍後
          <button type="button" className={`underline mx-1 ${linkClass}`} onClick={() => void reload()}>
            重試
          </button>
          。
        </p>
      )}
      {data === null && !failed && <p className={`py-8 ${muted}`}>載入中…</p>}
      {data && (
        <div className="py-5">
          <VoiceTimeSetting guildId={guildId} settings={data} onSaved={setData} />
          <Leaderboard rows={data.leaderboard} counting={data.voice_time_counter} />
          {extra?.(data, setData, reload)}
        </div>
      )}
    </section>
  )
}
