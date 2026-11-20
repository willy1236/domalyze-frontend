import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { SystemJob, SystemStatus } from "@/lib/dashboard-ops-system"
import { JobList, SystemCards } from "./ops-system"

const AT = Date.parse("2026-11-20T12:00:00Z")

const up: SystemStatus = {
  discord: {
    state: "up",
    ready: true,
    latency_ms: 43,
    started_at: "2026-11-20T10:00:00Z",
    guild_count: 12,
    unchunked_guilds: 0,
  },
  twitch: { state: "up", started_at: "2026-11-19T11:00:00Z", rooms: 5 },
  bus: { state: "up" },
  db: { state: "up", executor: { workers: 3, busy: 1, queued: 2 }, pool: { in_use: 4, limit: 15 } },
}

const render = (status: SystemStatus) => renderToStaticMarkup(<SystemCards status={status} at={AT} />)

describe("SystemCards", () => {
  it("全部正常時顯示各區的數值", () => {
    const html = render(up)
    for (const text of ["43 ms", "2 小時 0 分鐘", "全部載完", "1 天 1 小時", "已連線", "1 / 3", "4 / 15"]) {
      expect(html).toContain(text)
    }
  })

  it("成員快取未載完時顯示還剩幾個伺服器；未就緒另外標示", () => {
    const html = render({ ...up, discord: { ...up.discord, ready: false, unchunked_guilds: 3 } as SystemStatus["discord"] })
    expect(html).toContain("還剩 3 個伺服器")
    expect(html).toContain("未就緒")
  })

  it("一區無法取得、一區離線時，其他區照常顯示", () => {
    const html = render({ ...up, twitch: { state: "down" }, db: { state: "error" }, bus: { state: "unconfigured" } })
    expect(html).toContain("離線")
    expect(html).toContain("無法取得")
    expect(html).toContain("未設定 Redis")
    expect(html).toContain("43 ms")
    expect(html).not.toContain("已加入聊天室")
  })
})

describe("JobList", () => {
  const job = (id: string, last: SystemJob["last"]): SystemJob => ({
    id,
    name: `任務 ${id}`,
    trigger: "每 3 分鐘",
    next_run_at: "2026-11-20T12:03:00Z",
    last,
  })
  const at = "2026-11-20T12:00:00Z"

  it("離線、無法取得、排程未啟動、沒有週期任務分別提示", () => {
    expect(renderToStaticMarkup(<JobList jobs={{ state: "down" }} />)).toContain("離線")
    expect(renderToStaticMarkup(<JobList jobs={{ state: "error" }} />)).toContain("無法取得")
    expect(renderToStaticMarkup(<JobList jobs={{ state: "up", running: false, jobs: [] }} />)).toContain("排程未啟動")
    expect(renderToStaticMarkup(<JobList jobs={{ state: "up", running: true, jobs: [] }} />)).toContain(
      "此環境不執行週期任務",
    )
  })

  it("每列顯示名稱、觸發規則、下次執行與最近一次結果；失敗可展開錯誤訊息", () => {
    const html = renderToStaticMarkup(
      <JobList
        jobs={{
          state: "up",
          running: true,
          jobs: [
            job("a", { at, result: "error", duration_ms: 1500, error: "ValueError: 壞掉了" }),
            job("b", { at, result: "skipped", duration_ms: null, error: null }),
            job("c", null),
          ],
        }}
      />,
    )
    for (const text of ["任務 a", "每 3 分鐘", "失敗", "1.5 秒", "<details>", "ValueError: 壞掉了", "上一次還沒跑完而略過", "尚未執行"]) {
      expect(html).toContain(text)
    }
    expect(html.match(/border-red-500/g)).toHaveLength(2)
  })
})
