import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import { type Playlist, conflictOf, failureText, formatDuration, moveId, pruneSelection } from "./dashboard-playlists"

const playlist: Playlist = {
  id: 1,
  name: "我的歌",
  version: 3,
  songs: [{ id: 10, url: "https://x/a", title: "a", duration: 60, source_id: null }],
  sources: [],
}

describe("formatDuration", () => {
  it("同 /playlist show：mm:ss、h:mm:ss、未知為 --:--", () => {
    expect(formatDuration(65)).toBe("01:05")
    expect(formatDuration(3725)).toBe("1:02:05")
    expect(formatDuration(0)).toBe("00:00")
    expect(formatDuration(null)).toBe("--:--")
    expect(formatDuration(-5)).toBe("00:00")
  })
})

describe("moveId", () => {
  it("把指定位置的歌移到目標位置", () => {
    expect(moveId([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4])
    expect(moveId([1, 2, 3, 4], 3, 1)).toEqual([1, 4, 2, 3])
  })
  it("位置不變或超出範圍時不送出", () => {
    expect(moveId([1, 2], 1, 1)).toBeNull()
    expect(moveId([1, 2], 0, 2)).toBeNull()
    expect(moveId([1, 2], -1, 0)).toBeNull()
  })
  it("不改動原本的陣列", () => {
    const ids = [1, 2, 3]
    moveId(ids, 0, 2)
    expect(ids).toEqual([1, 2, 3])
  })
})

describe("pruneSelection", () => {
  it("換成最新內容後只保留仍存在的歌曲", () => {
    expect([...pruneSelection(new Set([10, 11]), playlist.songs)]).toEqual([10])
  })
})

describe("conflictOf", () => {
  it("409 conflict 帶出最新歌單", () => {
    const err = new DashboardApiError(409, "conflict", { error: "conflict", deleted: false, current: playlist }, false)
    expect(conflictOf(err)).toEqual({ current: playlist })
  })
  it("歌單已被刪除時 current 為 null", () => {
    const err = new DashboardApiError(409, "conflict", { error: "conflict", deleted: true, current: null }, false)
    expect(conflictOf(err)).toEqual({ current: null })
  })
  it("其他錯誤不是衝突", () => {
    expect(conflictOf(new DashboardApiError(400, "invalid_playlist", null, false))).toBeNull()
    expect(conflictOf(new Error("x"))).toBeNull()
  })
})

describe("failureText", () => {
  it("輸入錯誤顯示後端給的原因", () => {
    const err = new DashboardApiError(400, "invalid_playlist", { message: "歌單名稱不可為空" }, false)
    expect(failureText(err)).toBe("歌單名稱不可為空")
  })
  it("已由 wrapper 處理的錯誤不再顯示", () => {
    expect(failureText(new DashboardApiError(503, "bot_unavailable", null, true))).toBeNull()
  })
  it("未知的錯誤給通用說明", () => {
    expect(failureText(new TypeError("fetch failed"))).toBe("操作失敗，請稍後再試。")
  })
})
