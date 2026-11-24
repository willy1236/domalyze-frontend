import { describe, expect, it } from "vitest"
import {
  type ChannelHealth,
  FEATURE_NAMES,
  healthStatusLabel,
  ISSUE_TEXTS,
  issueText,
  needsRepair,
  pausedFeatureNames,
} from "./dashboard-channel-health"

describe("needsRepair", () => {
  it("沒有問題或只有 bot 離線不需要修復", () => {
    expect(needsRepair([])).toBe(false)
    expect(needsRepair(["bot_offline"])).toBe(false)
  })
  it("其餘問題都需要修復，bot_banned 也保留修復", () => {
    for (const issue of ["token_invalid", "not_mod", "bot_banned", "not_joined", "subscription_failed"] as const) {
      expect(needsRepair([issue])).toBe(true)
    }
    expect(needsRepair(["bot_offline", "not_mod"])).toBe(true)
  })
})

describe("issueText", () => {
  it("驗收條件要求的文案", () => {
    expect(issueText("not_mod").title).toBe("bot 不是 mod")
    expect(issueText("token_invalid").title).toBe("授權已失效")
    expect(issueText("bot_offline").title).toBe("bot 暫時離線")
  })
  it("bot_banned 的說明要實況主先解除封鎖", () => {
    expect(issueText("bot_banned").body).toContain("解除")
  })
  it("每個問題都有標題與說明", () => {
    for (const text of Object.values(ISSUE_TEXTS)) {
      expect(text.title).not.toBe("")
      expect(text.body).not.toBe("")
    }
  })
  it("不認得的代碼用代碼當標題", () => {
    expect(issueText("new_issue")).toEqual({ title: "new_issue", body: "" })
  })
})

describe("pausedFeatureNames", () => {
  it("功能代碼轉名稱", () => {
    expect(pausedFeatureNames(["follow_response", "gift_forward"])).toEqual(["追隨回應", "贈訂轉發"])
  })
  it("不認得的代碼原樣顯示", () => {
    expect(pausedFeatureNames(["speech", "new_feature"])).toEqual([FEATURE_NAMES.speech, "new_feature"])
  })
})

describe("C-10 部分暫停清單", () => {
  it.each([
    ["chat_moderation", /聊天室管理/],
    ["permit", /!permit/],
    ["enforcement_lift", /解除處罰/],
    ["blocked_terms", /Blocked Terms/i],
  ] as const)("後端列出 %s 時顯示對應功能名稱", (code, label) => {
    const [name] = pausedFeatureNames([code])
    expect(name).toMatch(label)
  })
})

describe("healthStatusLabel", () => {
  const health = (state: ChannelHealth["state"]): ChannelHealth => ({ state, issues: [], paused_features: [] })
  it("部分暫停顯示「星羽部分暫停」", () => {
    expect(healthStatusLabel("enabled", health("partial"))).toBe("星羽部分暫停")
  })
  it("其餘依 DB 的 state；沒有 health 也一樣", () => {
    expect(healthStatusLabel("enabled", health("enabled"))).toBe("星羽已啟用")
    expect(healthStatusLabel("disabled")).toBe("星羽已停用")
  })
})
