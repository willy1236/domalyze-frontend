import { type ChannelState, channelStatusLabel } from "@/lib/dashboard-channel"

/** bot 狀態標籤；這張卡只分已啟用與未啟用，完整的狀態判定之後擴充。 */
export function ChannelStatus({ state }: { state: ChannelState }) {
  const enabled = state === "enabled"
  return (
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
}
