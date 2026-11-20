import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  type BanResult,
  banNotice,
  createLimiter,
  isNotBotOwner,
  opsAuditPath,
  parseTokenProblemFilter,
  totalPages,
  withTokenProblemFilter,
} from "./dashboard-ops"

describe("isNotBotOwner", () => {
  it("只認 403 not_bot_owner", () => {
    expect(isNotBotOwner(new DashboardApiError(403, "not_bot_owner", null, false))).toBe(true)
    expect(isNotBotOwner(new DashboardApiError(403, "channel_forbidden", null, false))).toBe(false)
    expect(isNotBotOwner(new Error("x"))).toBe(false)
  })
})

describe("totalPages", () => {
  it("至少 1 頁，其餘進位", () => {
    expect(totalPages(0, 50)).toBe(1)
    expect(totalPages(50, 50)).toBe(1)
    expect(totalPages(51, 50)).toBe(2)
  })
})

describe("opsAuditPath", () => {
  it("頻道 id 要編碼", () => {
    expect(opsAuditPath("77/7")).toBe("/dashboard/ops/channels/77%2F7")
  })
})

describe("banNotice", () => {
  it("星羽離線時提醒上線後才會離開", () => {
    const result = (bot_offline: boolean) => ({ channel: {}, bot_offline }) as unknown as BanResult
    expect(banNotice(result(false))).toBe("已停權。")
    expect(banNotice(result(true))).toContain("上線後會離開聊天室")
  })
})

describe("createLimiter", () => {
  const deferred = () => {
    let resolve!: () => void
    const promise = new Promise<void>((r) => (resolve = r))
    return { promise, resolve }
  }

  it("同時最多跑 limit 個，其餘等前面完成", async () => {
    const run = createLimiter(3)
    const signal = new AbortController().signal
    let active = 0
    let peak = 0
    const gates = Array.from({ length: 7 }, deferred)
    const results = gates.map((gate, i) =>
      run(async () => {
        active += 1
        peak = Math.max(peak, active)
        await gate.promise
        active -= 1
        return i
      }, signal),
    )
    await Promise.resolve()
    expect(active).toBe(3)
    for (const gate of gates) {
      gate.resolve()
      await Promise.resolve()
      await Promise.resolve()
    }
    expect(await Promise.all(results)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(peak).toBe(3)
  })

  it("排隊中的任務在中止後不再開始，也不佔名額", async () => {
    const run = createLimiter(1)
    const controller = new AbortController()
    const gate = deferred()
    let started = 0
    const first = run(async () => {
      started += 1
      await gate.promise
    }, controller.signal)
    const queued = run(async () => {
      started += 1
    }, controller.signal)
    controller.abort()
    gate.resolve()
    await first
    await expect(queued).rejects.toMatchObject({ name: "AbortError" })
    expect(started).toBe(1)
    // 名額已釋放，之後的任務照常執行
    await expect(run(async () => "ok", new AbortController().signal)).resolves.toBe("ok")
  })

  it("任務失敗時不卡住後面的", async () => {
    const run = createLimiter(1)
    const signal = new AbortController().signal
    const failed = run(() => Promise.reject(new Error("boom")), signal)
    const after = run(async () => "next", signal)
    await expect(failed).rejects.toThrow("boom")
    await expect(after).resolves.toBe("next")
  })
})

describe("token 問題篩選的網址參數", () => {
  it("只認 token_problem=1", () => {
    expect(parseTokenProblemFilter("?token_problem=1")).toBe(true)
    expect(parseTokenProblemFilter("?token_problem=0")).toBe(false)
    expect(parseTokenProblemFilter("")).toBe(false)
  })

  it("切換時保留其他參數，關掉後沒有參數就是空字串", () => {
    expect(withTokenProblemFilter("?x=2", true)).toBe("?x=2&token_problem=1")
    expect(withTokenProblemFilter("?token_problem=1&x=2", false)).toBe("?x=2")
    expect(withTokenProblemFilter("?token_problem=1", false)).toBe("")
  })
})
