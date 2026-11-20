import { describe, expect, it } from "vitest"
import { voiceRankingErrorText, voiceRankingHref } from "./dashboard-voice-ranking"

describe("voiceRankingErrorText", () => {
  it("不在伺服器與 bot 已離開有專屬說明，其餘用通用說明", () => {
    expect(voiceRankingErrorText("not_member")).toContain("不在這個伺服器")
    expect(voiceRankingErrorText("bot_not_in_guild")).toContain("星羽已不在")
    expect(voiceRankingErrorText(null)).toContain("稍後")
  })
})

describe("voiceRankingHref", () => {
  it("指向伺服器的排行頁", () => {
    expect(voiceRankingHref("123")).toBe("/dashboard/voice-ranking/123")
  })
})
