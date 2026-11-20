import { describe, expect, it } from "vitest"
import {
  type RunResult,
  type SystemJob,
  busLabel,
  formatDurationMs,
  formatUptime,
  isProblem,
  stateLabel,
} from "./dashboard-ops-system"

const NOW = Date.parse("2026-11-20T12:00:00Z")

describe("formatUptime", () => {
  it("超過一天顯示天與小時", () => {
    expect(formatUptime("2026-11-17T08:30:00Z", NOW)).toBe("3 天 3 小時")
  })

  it("不到一天顯示小時與分鐘，不到一小時只顯示分鐘", () => {
    expect(formatUptime("2026-11-20T09:15:00Z", NOW)).toBe("2 小時 45 分鐘")
    expect(formatUptime("2026-11-20T11:48:30Z", NOW)).toBe("11 分鐘")
  })

  it("沒有啟動時間顯示不明，時鐘誤差造成的未來時間當成 0", () => {
    expect(formatUptime(null, NOW)).toBe("不明")
    expect(formatUptime("2026-11-20T12:01:00Z", NOW)).toBe("0 分鐘")
  })
})

describe("stateLabel", () => {
  it("離線與無法取得分開", () => {
    expect(stateLabel("up").text).toBe("正常")
    expect(stateLabel("down").text).toBe("離線")
    expect(stateLabel("error").text).toBe("無法取得")
  })

  it("匯流排顯示已連線、斷線、未設定 Redis", () => {
    expect(busLabel("up").text).toBe("已連線")
    expect(busLabel("down").text).toBe("斷線")
    expect(busLabel("unconfigured").text).toBe("未設定 Redis")
    expect(busLabel("error").text).toBe("無法取得")
  })
})

describe("排程任務", () => {
  const job: SystemJob = { id: "a", name: "地震報告", trigger: "每 3 分鐘", next_run_at: null, last: null }
  const last = (result: RunResult) => ({ at: "2026-11-20T00:00:00Z", result, duration_ms: null, error: null })

  it("尚未執行與成功不算問題，失敗、錯過、略過都算", () => {
    expect(isProblem(job)).toBe(false)
    expect(isProblem({ ...job, last: last("success") })).toBe(false)
    for (const result of ["error", "missed", "skipped"] as const) expect(isProblem({ ...job, last: last(result) })).toBe(true)
  })

  it("耗時不到 1 秒顯示毫秒", () => {
    expect(formatDurationMs(830)).toBe("830 ms")
    expect(formatDurationMs(12345)).toBe("12.3 秒")
  })
})
