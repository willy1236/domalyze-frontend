import { describe, expect, it } from "vitest"
import { formatRecordTime, formatSpan, formatVoiceMinutes, guildLabel, UNKNOWN_GUILD } from "./dashboard-records"

describe("formatVoiceMinutes", () => {
  it("換算成「X 小時 Y 分」", () => {
    expect(formatVoiceMinutes(127)).toBe("2 小時 7 分")
    expect(formatVoiceMinutes(5)).toBe("0 小時 5 分")
    expect(formatVoiceMinutes(0)).toBe("0 小時 0 分")
  })
})

describe("formatSpan", () => {
  it("依天、小時、分顯示，省略 0 的單位", () => {
    expect(formatSpan(3600)).toBe("1 小時")
    expect(formatSpan(86400 + 2 * 3600 + 180)).toBe("1 天 2 小時 3 分")
    expect(formatSpan(30)).toBe("不到 1 分")
  })
})

describe("guildLabel", () => {
  it("取不到名稱時顯示無法取得名稱的伺服器", () => {
    expect(guildLabel(null)).toBe(UNKNOWN_GUILD)
    expect(guildLabel("快樂營")).toBe("快樂營")
  })
})

describe("formatRecordTime", () => {
  it("沒有時間的紀錄（舊版指令下注）顯示時間不明", () => {
    expect(formatRecordTime(null)).toBe("時間不明")
  })
})
