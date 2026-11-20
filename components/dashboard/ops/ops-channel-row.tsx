"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { DashboardApiError } from "@/lib/dashboard-api"
import { healthStatusLabel, issueText, pausedFeatureNames, type ChannelHealth } from "@/lib/dashboard-channel-health"
import { type BanResult, type OpsChannel, banNotice, fetchOpsHealth, opsAuditPath, unbanChannel } from "@/lib/dashboard-ops"
import { BanForm } from "./ban-form"

type Limiter = <T>(task: () => Promise<T>, signal: AbortSignal) => Promise<T>

/** 已啟用的頻道才補查完整判定；其餘狀態只有 DB 狀態。離開頁面或翻頁時中止，排隊中的不再送出。 */
function useHealth(channel: OpsChannel, limiter: Limiter): { health: ChannelHealth | null; failed: boolean } {
  const [loaded, setLoaded] = useState<{ id: string; health: ChannelHealth | null } | null>(null)
  const enabled = channel.state === "enabled"
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    limiter(() => fetchOpsHealth(channel.id, controller.signal), controller.signal).then(
      (health) => {
        if (!controller.signal.aborted) setLoaded({ id: channel.id, health })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        console.error("load ops health failed", error)
        setLoaded({ id: channel.id, health: null })
      },
    )
    return () => controller.abort()
  }, [channel.id, enabled, limiter])
  const done = enabled && loaded?.id === channel.id
  return { health: done ? loaded.health : null, failed: done && loaded.health === null }
}

function Avatar({ channel }: { channel: OpsChannel }) {
  return channel.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={channel.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full shrink-0" />
  ) : (
    <span
      aria-hidden
      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-champagne/20 text-champagne font-serif"
    >
      {Array.from(channel.name)[0] ?? "?"}
    </span>
  )
}

export function OpsChannelRow({
  channel,
  limiter,
  onChanged,
}: {
  channel: OpsChannel
  limiter: Limiter
  /** 停權或解除停權完成，清單要重新載入 */
  onChanged: () => Promise<void>
}) {
  const { health, failed: healthFailed } = useHealth(channel, limiter)
  const [mode, setMode] = useState<"idle" | "ban" | "unban">("idle")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const banned = channel.state === "banned"

  async function unban() {
    setBusy(true)
    setError(false)
    try {
      await unbanChannel(channel.id)
      setMessage("已解除停權，頻道回到已停用，實況主可以自己重新啟用。")
      setMode("idle")
      await onChanged()
    } catch (e) {
      if (!(e instanceof DashboardApiError && e.handled)) setError(true)
    } finally {
      setBusy(false)
    }
  }

  async function afterBan(result: BanResult) {
    setMessage(banNotice(result))
    setMode("idle")
    await onChanged()
  }

  return (
    <li className="border border-champagne/30 px-4 py-3 space-y-2 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar channel={channel} />
        <div className="min-w-0 flex-1">
          <p className="truncate">{channel.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {channel.login ?? "沒有登入名稱"}・{channel.id}
          </p>
        </div>
        <span className="text-xs shrink-0 text-champagne">{healthStatusLabel(channel.state, health ?? undefined)}</span>
      </div>

      {channel.state === "enabled" && !health && !healthFailed && (
        <p className="text-xs text-gray-600 dark:text-gray-400">判定中…</p>
      )}
      {healthFailed && <p className="text-xs text-gray-600 dark:text-gray-400">暫時查不到權限狀態。</p>}
      {health && health.issues.length > 0 && (
        <div className="text-xs space-y-1">
          <ul className="space-y-0.5">
            {health.issues.map((issue) => (
              <li key={issue}>{issueText(issue).title}</li>
            ))}
          </ul>
          {health.paused_features.length > 0 && <p>暫停中的功能：{pausedFeatureNames(health.paused_features).join("、")}</p>}
        </div>
      )}
      {banned && (
        <p className="text-xs">
          停權理由：{channel.banned_reason ?? "未填"}
          {channel.banned_at && `（${new Date(channel.banned_at).toLocaleString("zh-TW")}）`}
        </p>
      )}

      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}

      {mode === "ban" ? (
        <BanForm channelId={channel.id} onDone={(result) => void afterBan(result)} onCancel={() => setMode("idle")} />
      ) : mode === "unban" ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            解除後頻道回到已停用，不會自動啟用，實況主要自己重新啟用。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="danger" disabled={busy} onClick={() => void unban()}>
              確認解除停權
            </Button>
            <Button type="button" disabled={busy} onClick={() => setMode("idle")}>
              取消
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link
            href={opsAuditPath(channel.id)}
            className="inline-block border border-champagne/40 text-champagne text-xs tracking-widest uppercase px-3 py-1.5 hover:bg-champagne hover:text-background-dark transition-colors"
          >
            修改紀錄
          </Link>
          {banned ? (
            <Button type="button" size="sm" onClick={() => setMode("unban")}>
              解除停權
            </Button>
          ) : (
            <Button type="button" size="sm" variant="danger" onClick={() => setMode("ban")}>
              停權
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          操作失敗，請稍後再試。
        </p>
      )}
    </li>
  )
}
