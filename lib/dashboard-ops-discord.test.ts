import { describe, expect, it } from "vitest"
import {
  type GuildEvent,
  discordUserUrl,
  guildEventLabel,
  isLookupFailure,
  isValidId,
  lookupFailureText,
  lookupPath,
  memberStatusLabel,
  messageContentText,
} from "./dashboard-ops-discord"

const base: GuildEvent = {
  id: 1,
  guild_id: "1",
  guild_name: "g",
  event: "join",
  member_count: 3,
  at: "2026-11-20T00:00:00+08:00",
  source: "gateway",
}

describe("guildEventLabel", () => {
  it("不論來源只顯示加入或離開", () => {
    expect(guildEventLabel(base)).toBe("加入")
    expect(guildEventLabel({ ...base, event: "leave", source: "startup" })).toBe("離開")
  })
})

describe("discordUserUrl", () => {
  it("連到 Discord 個人資料頁", () => {
    expect(discordUserUrl("419131103836635136")).toBe("https://discord.com/users/419131103836635136")
  })
})

describe("lookupPath", () => {
  it("只有 ID 時不帶頻道參數", () => {
    expect(lookupPath("123")).toBe("/dashboard/ops/discord/lookup?id=123")
  })
  it("查訊息時帶上頻道 ID", () => {
    expect(lookupPath("123", "456")).toBe("/dashboard/ops/discord/lookup?id=123&channel_id=456")
  })
})

describe("isValidId", () => {
  it("接受 1 到 2^64-1 的整數", () => {
    expect(isValidId("1")).toBe(true)
    expect(isValidId("419131103836635136")).toBe(true)
    expect(isValidId("18446744073709551615")).toBe(true)
    expect(isValidId("007")).toBe(true)
  })
  it("拒絕非數字、0 與超出範圍", () => {
    for (const value of ["", "abc", "12a", "-1", "1.5", "0", "000", "18446744073709551616", "100000000000000000000"]) {
      expect(isValidId(value)).toBe(false)
    }
  })
})

describe("lookupFailureText", () => {
  it("依錯誤碼顯示訊息", () => {
    expect(lookupFailureText({ kind: "message", error: "channel_not_found" })).toBe("找不到這個頻道")
    expect(lookupFailureText({ kind: "message", error: "forbidden" })).toBe("沒有權限讀取這則訊息")
    expect(lookupFailureText({ kind: "user", error: "unavailable" })).toBe("暫時查不到，請稍後再試")
  })
  it("isLookupFailure 只認有 error 的項目", () => {
    expect(isLookupFailure({ kind: "user", error: "unavailable" })).toBe(true)
    expect(
      isLookupFailure({ kind: "channel", id: "1", name: "c", type: "text", category: null, guild: null, created_at: null }),
    ).toBe(false)
  })
})

describe("memberStatusLabel", () => {
  it("沒有 presence 資料時顯示不明，不當成離線", () => {
    expect(memberStatusLabel(null)).toBe("不明")
    expect(memberStatusLabel("offline")).toBe("離線")
    expect(memberStatusLabel("dnd")).toBe("請勿打擾")
  })
})

describe("messageContentText", () => {
  it("區分讀不到內容與空訊息", () => {
    expect(messageContentText({ content: "", content_hidden: true })).toBe("讀不到內容（未開啟 message content intent）")
    expect(messageContentText({ content: "", content_hidden: false })).toBeNull()
    expect(messageContentText({ content: "嗨", content_hidden: false })).toBe("嗨")
  })
})
