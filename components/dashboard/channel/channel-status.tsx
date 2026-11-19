import { type ChannelState, channelStatusLabel } from "@/lib/dashboard-channel"
import { ChannelActivation } from "./channel-activation"

/**
 * bot 狀態標籤；完整的狀態判定之後擴充。
 * 給 channelId 時，標籤下方多出啟用、停用的按鈕與啟用流程的提示（要在 ChannelAccessGuard 內）。
 */
export function ChannelStatus({ state, channelId }: { state: ChannelState; channelId?: string }) {
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
      {channelStatusLabel(state)}
    </span>
  )
  if (channelId === undefined) return label
  return (
    <div className="flex flex-col items-start gap-3">
      {label}
      <ChannelActivation channelId={channelId} state={state} />
    </div>
  )
}
