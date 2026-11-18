import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PublicSettingsView } from "@/components/dashboard/personal/public-settings"
import type { PublicProfile } from "@/lib/dashboard-public"
import { NotFoundView, PublicProfileView, UnavailableView } from "./public-profile"

const profile = (over: Partial<PublicProfile> = {}): PublicProfile => ({ username: "willy", sections: [], discords: [], playlists: null, ...over })

describe("PublicProfileView", () => {
  it("沒有勾選區塊時只有代號與沒有公開的內容", () => {
    const out = renderToStaticMarkup(<PublicProfileView profile={profile()} />)
    expect(out).toContain("willy")
    expect(out).toContain("沒有公開的內容")
    expect(out).not.toContain("<section")
  })

  it("只顯示被勾選的區塊", () => {
    const out = renderToStaticMarkup(
      <PublicProfileView profile={profile({ sections: ["points"], discords: [{ label: "帳號一", points: { stardust: 1, point: 2, rcoin: 3 } }] })} />,
    )
    expect(out).toContain("積分")
    expect(out).toContain("帳號一")
    expect(out).not.toContain("沒有公開的內容")
    expect(out).not.toContain("語音時數")
  })

  it("歌單顯示名稱與歌曲連結", () => {
    const out = renderToStaticMarkup(
      <PublicProfileView profile={profile({ sections: ["playlists"], playlists: [{ name: "晨跑", songs: [{ title: "歌 A", url: "https://x/a" }] }] })} />,
    )
    expect(out).toContain("晨跑")
    expect(out).toContain('href="https://x/a"')
  })
})

describe("找不到與暫時無法顯示", () => {
  it("兩個畫面各自的文案", () => {
    expect(renderToStaticMarkup(<NotFoundView />)).toContain("找不到這個頁面")
    const unavailable = renderToStaticMarkup(<UnavailableView />)
    expect(unavailable).toContain("暫時無法顯示")
    expect(unavailable).not.toContain("找不到")
  })
})

describe("PublicSettingsView", () => {
  const settings = { available: true as const, enabled: true, sections: ["points" as const], username: "willy" }
  const render = (s: Parameters<typeof PublicSettingsView>[0]["settings"] = settings) => renderToStaticMarkup(<PublicSettingsView settings={s} origin="https://x.test" busy={false} error={null} onChange={() => {}} />)

  it("開啟時顯示公開網址與六個可勾選區塊，沒有存檔鈕", () => {
    const out = render()
    expect(out).toContain("https://x.test/u/willy")
    expect(out.match(/type="checkbox"/g)).toHaveLength(7)
    expect(out).not.toContain("<button")
  })

  it("警告、雲端資料夾共用與 NetBird 沒有選項", () => {
    const out = render()
    expect(out).toContain("不會公開")
    expect(out).not.toMatch(/<span[^>]*>警告/)
  })

  it("關閉時只有開關", () => {
    const out = render({ ...settings, enabled: false })
    expect(out.match(/type="checkbox"/g)).toHaveLength(1)
    expect(out).not.toContain("/u/willy")
  })

  it("代號暫時無法載入時不顯示公開網址", () => {
    const out = render({ available: true, enabled: true, sections: [], username: null })
    expect(out).toContain("代號暫時無法載入")
    expect(out).not.toContain("/u/")
  })
})
