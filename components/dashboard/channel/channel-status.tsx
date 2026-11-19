"use client"

import { useEffect, useState } from "react"
import { LinkButton } from "@/components/ui"
import { type ChannelState, enableUrl } from "@/lib/dashboard-channel"
import {
  type ChannelHealth,
  healthStatusLabel,
  issueText,
  needsRepair,
  pausedFeatureNames,
} from "@/lib/dashboard-channel-health"
import { ChannelActivation } from "./channel-activation"

/** 權限問題、暫停的功能與「修復」；修復就是重新走啟用流程，和「啟用星羽」同一個入口。 */
function ChannelIssues({ channelId, health }: { channelId: string; health: ChannelHealth }) {
  const [origin, setOrigin] = useState<string | null>(null)
  // 啟用入口要帶前端的 origin；等 hydration 後才有，之前按鈕沒有連結
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin)
  }, [])
  const paused = pausedFeatureNames(health.paused_features)
  return (
    <div role="status" className="border border-champagne/30 px-3 py-2 text-xs space-y-2">
      <ul className="space-y-1">
        {health.issues.map((issue) => {
          const { title, body } = issueText(issue)
          return (
            <li key={issue}>
              <strong className="font-medium">{title}</strong>
              {body && <span className="text-gray-600 dark:text-gray-400">：{body}</span>}
            </li>
          )
        })}
      </ul>
      {paused.length > 0 && <p>暫停中的功能：{paused.join("、")}</p>}
      {needsRepair(health.issues) && (
        <LinkButton variant="outline" href={origin === null ? undefined : enableUrl(channelId, origin)}>
          修復
        </LinkButton>
      )}
    </div>
  )
}

/**
 * 星羽狀態標籤。給 channelId 時，標籤下方多出權限問題與「修復」、啟用、停用的按鈕與啟用流程的提示
 * （要在 ChannelAccessGuard 內）。
 */
export function ChannelStatus({
  state,
  channelId,
  health,
}: {
  state: ChannelState
  channelId?: string
  health?: ChannelHealth
}) {
  const enabled = state === "enabled"
  const label = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
        enabled
          ? "border-primary/40 dark:border-champagne/50 text-primary dark:text-champagne"
          : "border-gray-400/40 text-gray-500 dark:text-gray-400"
      }`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-champagne" : "bg-gray-400"}`} />
      {healthStatusLabel(state, health)}
    </span>
  )
  if (channelId === undefined) return label
  return (
    <div className="flex flex-col items-start gap-3">
      {label}
      {health && health.issues.length > 0 && <ChannelIssues channelId={channelId} health={health} />}
      <ChannelActivation channelId={channelId} state={state} />
    </div>
  )
}
