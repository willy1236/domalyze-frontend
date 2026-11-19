import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { PersonalOverview } from "@/lib/dashboard-personal"
import { type DashboardUser, DashboardUserContext } from "@/lib/dashboard-user"

const load = vi.hoisted(() => ({ overview: null as unknown }))
vi.mock("@/lib/use-load", () => ({
  useLoad: (fetcher: unknown) => ({ data: fetcher === null ? null : load.overview, failed: false }),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {} }) }))

import PersonalPage from "./page"

const twitchUser: DashboardUser = {
  id: "twitch:777",
  name: "Streamer",
  avatar_url: null,
  discord: null,
  twitch: { id: "777", login: "streamer" },
  account: null,
  login_method: "twitch",
  has_channels: true,
}

describe("個人區頁面", () => {
  it("Twitch 登入不被導走，顯示 Twitch 身分與我的頻道，沒有 Discord 區塊", () => {
    load.overview = {
      account: null,
      partial: false,
      discords: [],
      channels: [{ id: "777", login: "streamer", name: "Streamer", avatar_url: null, state: "enabled" }],
    } satisfies PersonalOverview
    const html = renderToStaticMarkup(
      <DashboardUserContext.Provider value={twitchUser}>
        <PersonalPage />
      </DashboardUserContext.Provider>,
    )
    expect(html).toContain("Streamer")
    expect(html).toContain("我的頻道")
    expect(html).toContain('href="/dashboard/channels/777"')
    expect(html).not.toContain("紀錄")
    expect(html).not.toContain("歌單")
  })
})
