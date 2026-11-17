import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { PersonalSection } from "./personal-section"

/** 公開頁區塊（T-11 實作）；沒有析域帳號時顯示鎖住 */
export function PublicSettingsSection({ overview }: { overview: PersonalOverview }) {
  if (!isLocked(overview)) return null
  return <PersonalSection title="公開頁" locked />
}
