import Link from "next/link"
import { channelPath, channelStatusLabel } from "@/lib/dashboard-channel"
import type { PersonalOverview } from "@/lib/dashboard-personal"
import { PersonalSection } from "./personal-section"
import { UserAvatar } from "@/components/user-avatar"

/** 我的頻道：析域帳號連結的 Twitch 頻道與 bot 狀態，連到頻道後台；沒有頻道時不顯示 */
export function ChannelsSection({ overview }: { overview: PersonalOverview }) {
  if (overview.channels.length === 0) return null
  return (
    <PersonalSection title="我的頻道">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {overview.channels.map((channel) => (
          <li key={channel.id}>
            <Link
              href={channelPath(channel.id)}
              className="flex items-center gap-3 border border-champagne/30 px-4 py-3 hover:border-champagne transition-colors"
            >
              <UserAvatar src={channel.avatar_url} name={channel.name} className="w-10 h-10" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{channel.name}</span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {channelStatusLabel(channel.state)}
                </span>
              </span>
              <span className="text-xs tracking-widest uppercase text-champagne shrink-0">管理</span>
            </Link>
          </li>
        ))}
      </ul>
    </PersonalSection>
  )
}
