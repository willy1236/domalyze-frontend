import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { PersonalSection } from "./personal-section"

/** 歌單區塊（T-07 實作）；沒有析域帳號時顯示鎖住 */
export function PlaylistsSection({ overview }: { overview: PersonalOverview }) {
  if (!isLocked(overview)) return null
  return <PersonalSection title="歌單" locked />
}
