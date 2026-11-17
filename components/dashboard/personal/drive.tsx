import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { PersonalSection } from "./personal-section"

/** 雲端資料夾共用區塊（T-08 實作）；沒有析域帳號時顯示鎖住 */
export function DriveSection({ overview }: { overview: PersonalOverview }) {
  if (!isLocked(overview)) return null
  return <PersonalSection title="雲端資料夾共用" locked />
}
