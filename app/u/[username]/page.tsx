import type { Metadata } from "next"
import { PublicProfilePage } from "@/components/public/public-profile"

// 公開頁不讓搜尋引擎收錄；不在 app/dashboard 底下，不需要登入也不載入 dashboard layout
export const metadata: Metadata = {
  title: "域民公開頁｜星羽 Xingyu",
  robots: { index: false, follow: false },
}

export default async function PublicUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  let name = username
  try {
    name = decodeURIComponent(username)
  } catch {
    // 網址編碼不合法時原樣查詢，後端會回找不到
  }
  return <PublicProfilePage username={name} />
}
