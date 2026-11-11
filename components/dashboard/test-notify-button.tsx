"use client"

import { useEffect, useState } from "react"
import { DashboardApiError, dashboardFetch } from "@/lib/dashboard-api"
import type { NotifyItem } from "@/lib/dashboard-notifies"

const buttonClass =
  "border border-primary/30 dark:border-champagne/30 text-primary dark:text-silver px-3 py-1.5 text-xs tracking-widest uppercase hover:bg-primary hover:text-white dark:hover:bg-champagne dark:hover:text-background-dark transition-colors disabled:opacity-60 disabled:hover:bg-transparent disabled:cursor-not-allowed tabular-nums"

interface Props {
  guildId: string
  item: NotifyItem
  /** 那一筆已被刪除或改過時重新載入一覽 */
  onChanged: () => void
}

/** wrapper 已處理的錯誤（提示或導向）回 null，不重複顯示 */
function failureMessage(e: unknown): string | null {
  if (!(e instanceof DashboardApiError)) return "發送失敗，請稍後再試。"
  if (e.handled) return null
  if (e.code === "send_failed") return `發送失敗：${String(e.body?.reason ?? "未知原因")}`
  return "發送失敗，請稍後再試。"
}

/** 用已存的設定發送一則測試通知；1 分鐘共用冷卻，失敗不計入冷卻。 */
export function TestNotifyButton({ guildId, item, onChanged }: Props) {
  const [cooldownUntil, setCooldownUntil] = useState(() => Date.now() + (item.cooldown ?? 0) * 1000)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 一覽重新載入後以伺服器的剩餘秒數為準（別的管理員剛測試過也看得到）
  const serverCooldown = item.cooldown ?? 0
  useEffect(() => {
    // 剩餘秒數要以收到的當下換算成時間點，Date.now() 不能在 render 裡呼叫，只能在 effect 設定
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCooldownUntil(Date.now() + serverCooldown * 1000)
    setNow(Date.now())
  }, [serverCooldown])

  const left = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const cooling = left > 0
  useEffect(() => {
    if (!cooling) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [cooling])

  if (item.testable === false) return null

  const startCooldown = (seconds: number) => {
    setCooldownUntil(Date.now() + seconds * 1000)
    setNow(Date.now())
  }

  const send = async () => {
    const target = item.account ? `${item.name}（${item.account.display_name}）` : item.name
    const channel = item.channel.name ? `#${item.channel.name}` : item.channel.id
    if (!window.confirm(`要在 ${channel} 發送一則「${target}」的測試通知嗎？`)) return
    setBusy(true)
    setError(null)
    try {
      const res = await dashboardFetch<{ cooldown: number }>(`/dashboard/guilds/${guildId}/notifies/test`, {
        method: "POST",
        json: {
          kind: item.key.startsWith("community:") ? "community" : "channel",
          notify_type: item.key,
          account_id: item.account?.id,
        },
      })
      startCooldown(res.cooldown)
    } catch (e) {
      if (e instanceof DashboardApiError && e.code === "cooldown") {
        startCooldown(Number(e.body?.retry_after) || 60)
      } else if (e instanceof DashboardApiError && e.code === "conflict") {
        setError("這筆通知已被刪除，請重新整理。")
        onChanged()
      } else {
        setError(failureMessage(e))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className={buttonClass} disabled={busy || cooling} onClick={() => void send()}>
        {busy ? "發送中…" : cooling ? `測試（${left} 秒）` : "測試"}
      </button>
      {error && (
        <p role="alert" className="max-w-[14rem] text-right text-xs text-red-700 dark:text-red-300 break-words">
          {error}
        </p>
      )}
    </div>
  )
}
