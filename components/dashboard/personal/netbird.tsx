import { type PersonalOverview, isLocked } from "@/lib/dashboard-personal"
import { PersonalSection } from "./personal-section"

/** NetBird 區塊（T-09 實作）；沒有析域帳號時顯示鎖住 */
export function NetbirdSection({ overview }: { overview: PersonalOverview }) {
  if (!isLocked(overview)) return null
  return <PersonalSection title="NetBird" locked />
}
