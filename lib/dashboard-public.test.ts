import { afterEach, describe, expect, it, vi } from "vitest"
import {
  type PublicProfile,
  buildBlocks,
  fetchPublicProfile,
  formatMinutes,
  hasNoContent,
  publicPath,
  saveSettings,
  toggleSection,
} from "./dashboard-public"

const profile = (over: Partial<PublicProfile> = {}): PublicProfile => ({ username: "willy", sections: [], discords: [], playlists: null, ...over })

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body })
  vi.stubGlobal("fetch", fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe("toggleSection", () => {
  it("加入後依固定順序排列，取消後移除", () => {
    expect(toggleSection(["voice"], "points", true)).toEqual(["points", "voice"])
    expect(toggleSection(["points", "voice"], "points", false)).toEqual(["voice"])
    expect(toggleSection(["points"], "points", true)).toEqual(["points"])
  })
})

describe("publicPath", () => {
  it("代號做網址編碼", () => {
    expect(publicPath("willy")).toBe("/u/willy")
    expect(publicPath("a b/c")).toBe("/u/a%20b%2Fc")
  })
})

describe("formatMinutes", () => {
  it("格式為 X 小時 Y 分", () => {
    expect(formatMinutes(127)).toBe("2 小時 7 分")
    expect(formatMinutes(0)).toBe("0 小時 0 分")
  })
})

describe("buildBlocks", () => {
  it("沒勾任何區塊時沒有內容", () => {
    expect(buildBlocks(profile())).toEqual([])
    expect(hasNoContent(profile())).toBe(true)
  })

  it("只勾積分時只有積分區塊，以帳號一、帳號二區分", () => {
    const blocks = buildBlocks(
      profile({
        sections: ["points"],
        discords: [
          { label: "帳號一", points: { stardust: 1200, point: 3, rcoin: 0 } },
          { label: "帳號二", points: { stardust: 5, point: 6, rcoin: 7 } },
        ],
      }),
    )
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ key: "points", title: "積分" })
    const rows = (blocks[0] as { rows: { who: string; value: string }[] }).rows
    expect(rows.map((r) => r.who)).toEqual(["帳號一", "帳號二"])
    expect(rows[0].value).toContain("1,200")
  })

  it("勾了 Discord 名稱時用名稱，沒有名稱的退回帳號一", () => {
    const blocks = buildBlocks(
      profile({
        sections: ["discord_names", "voice"],
        discords: [
          { label: "帳號一", name: "小明", voice_minutes: 65 },
          { label: "帳號二", name: null, voice_minutes: 0 },
        ],
      }),
    )
    const rows = (blocks[0] as { rows: { who: string; value: string }[] }).rows
    expect(rows).toEqual([
      { who: "小明", value: "1 小時 5 分" },
      { who: "帳號二", value: "0 小時 0 分" },
    ])
    expect(hasNoContent(profile({ sections: ["discord_names"] }))).toBe(false)
  })

  it("參與次數只有三個數字；寵物沒有時顯示沒有寵物", () => {
    const blocks = buildBlocks(
      profile({
        sections: ["pets", "participation"],
        discords: [{ label: "帳號一", pet: null, participation: { polls: 2, bets: 0, giveaways: 5 } }],
      }),
    )
    expect(blocks.map((b) => b.key)).toEqual(["pets", "participation"])
    expect((blocks[0] as { rows: { value: string }[] }).rows[0].value).toBe("沒有寵物")
    expect((blocks[1] as { rows: { value: string }[] }).rows[0].value).toBe("投票 2・賭盤 0・抽獎 5")
  })

  it("歌單區塊帶歌單與歌曲", () => {
    const playlists = [{ name: "晨跑", songs: [{ title: "A", url: "https://x/a" }] }]
    const blocks = buildBlocks(profile({ sections: ["playlists"], playlists }))
    expect(blocks).toEqual([{ key: "playlists", title: "歌單", playlists }])
  })
})

describe("fetchPublicProfile", () => {
  it("成功時回傳內容，且請求的是公開端點", async () => {
    const fn = mockFetch(200, profile())
    const result = await fetchPublicProfile("a b")
    expect(result).toEqual({ kind: "ok", profile: profile() })
    expect(fn.mock.calls[0][0]).toBe("/dashboard/public/a%20b")
  })

  it("404 not_found 與 503 directory_unavailable 各自回報", async () => {
    mockFetch(404, { error: "not_found" })
    expect(await fetchPublicProfile("x")).toEqual({ kind: "not_found" })
    mockFetch(503, { error: "directory_unavailable" })
    expect(await fetchPublicProfile("x")).toEqual({ kind: "unavailable" })
  })

  it("其他錯誤往外丟", async () => {
    mockFetch(500, { detail: "boom" })
    await expect(fetchPublicProfile("x")).rejects.toThrow()
  })
})

describe("saveSettings", () => {
  it("以 PUT 送出開關與勾選", async () => {
    const fn = mockFetch(200, { available: true, enabled: true, sections: ["points"], username: "willy" })
    const result = await saveSettings(true, ["points"])
    expect(result).toMatchObject({ enabled: true, sections: ["points"] })
    const [url, init] = fn.mock.calls[0]
    expect(url).toBe("/dashboard/personal/public")
    expect(init.method).toBe("PUT")
    expect(JSON.parse(init.body)).toEqual({ enabled: true, sections: ["points"] })
  })
})
