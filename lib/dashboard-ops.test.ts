import { describe, expect, it } from "vitest"
import { DashboardApiError } from "./dashboard-api"
import {
  type AuditEntry,
  type BanResult,
  auditLabels,
  banNotice,
  createLimiter,
  isNotBotOwner,
  opsAuditPath,
  totalPages,
} from "./dashboard-ops"

const entry = (patch: Partial<AuditEntry> = {}): AuditEntry => ({
  id: 1,
  at: "2026-01-01T00:00:00+00:00",
  actor: { platform: "discord", id: "111", name: "Owner" },
  source: "dashboard",
  target_kind: "channel",
  target_key: "ban",
  action: "update",
  before: null,
  after: null,
  ...patch,
})

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

describe("auditLabels", () => {
  it("頻道層級的操作顯示可讀名稱", () => {
    expect(auditLabels(entry()).target).toBe("頻道：停權")
    expect(auditLabels(entry({ target_key: "unban" })).target).toBe("頻道：解除停權")
    expect(auditLabels(entry({ target_key: "all_data", action: "delete" }))).toMatchObject({
      target: "頻道：刪除所有資料",
      action: "刪除",
    })
  })
  it("其他類別顯示類別與 key，來源與操作者帶平台", () => {
    expect(auditLabels(entry({ target_kind: "command", target_key: "hi", source: "chat" }))).toEqual({
      target: "自訂指令：hi",
      action: "修改",
      source: "聊天室",
      actor: "Discord Owner",
    })
  })
  it("不認得的代碼直接顯示", () => {
    expect(auditLabels(entry({ target_kind: "future", target_key: "k" })).target).toBe("future：k")
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
