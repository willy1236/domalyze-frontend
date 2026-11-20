import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HomeFeaturesSection } from "@/components/home"
import { CHANNEL_LIST_PATH } from "@/lib/dashboard-channel"
import { TWITCH_FEATURES } from "@/lib/features-data"
import TwitchPage from "./page"

describe("Twitch bot 介紹頁", () => {
  const html = renderToStaticMarkup(<TwitchPage />)

  it("列出四項已上線的功能", () => {
    expect(TWITCH_FEATURES.map((f) => f.title)).toEqual(["自訂指令", "計時訊息", "事件回應", "轉發 Discord"])
    for (const feature of TWITCH_FEATURES) expect(html).toContain(feature.title)
  })
  it("不提還沒做的點數系統與聊天室管理", () => {
    for (const text of ["點數名稱", "點數系統", "觀眾點數", "聊天室管理"]) expect(html).not.toContain(text)
  })
  it("兩個「開始使用」都連到頻道後台", () => {
    const links = [...html.matchAll(/<a [^>]*href="([^"]*)"[^>]*>(?:<span[^>]*><\/span>)?<span[^>]*>開始使用/g)].map((m) => m[1])
    expect(links).toEqual([CHANNEL_LIST_PATH, CHANNEL_LIST_PATH])
  })
})

describe("首頁功能區", () => {
  it("有連到 Twitch bot 介紹頁的連結", () => {
    expect(renderToStaticMarkup(<HomeFeaturesSection />)).toMatch(/href="\/twitch"[^>]*>(?:<span[^>]*>)?Twitch bot 介紹/)
  })
})
