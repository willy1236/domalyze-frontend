import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { WarningRecordRow } from "./warning-record-row"
import type { WarningRecord } from "@/lib/dashboard-warnings"

const base: WarningRecord = {
  id: 12,
  kind: "timeout",
  target: { id: "1", name: "小明", avatar_url: null, left: false },
  moderator: { id: "2", name: "管理員", avatar_url: null, left: false },
  reason: "洗頻",
  created_at: "2026-11-10T09:05:00Z",
  duration_seconds: 600,
  cross_guild: true,
  this_guild: true,
  sheet: { title: "小明 的警告單", description: "**編號：12**" },
}

describe("WarningRecordRow", () => {
  it("顯示編號、種類、時長、對象、原因與跨群標示", () => {
    const out = renderToStaticMarkup(<WarningRecordRow record={base} />)
    expect(out).toContain("#12")
    expect(out).toContain("禁言・10 分鐘")
    expect(out).toContain("小明")
    expect(out).toContain("洗頻")
    expect(out).toContain("跨群")
  })

  it("只在本伺服器的紀錄沒有跨群標示，其他伺服器發出的有註記", () => {
    const out = renderToStaticMarkup(<WarningRecordRow record={{ ...base, cross_guild: false, this_guild: false }} />)
    expect(out).not.toContain(">跨群<")
    expect(out).toContain("其他伺服器發出")
  })

  it("已離開的對象標示已離開的成員", () => {
    const out = renderToStaticMarkup(
      <WarningRecordRow record={{ ...base, target: { id: "9", name: null, avatar_url: null, left: true } }} />,
    )
    expect(out).toContain("已離開的成員（9）")
  })

  it("動作插槽渲染在列上，警告單預設收合", () => {
    const out = renderToStaticMarkup(<WarningRecordRow record={base} actions={<button>移除</button>} />)
    expect(out).toContain("移除")
    expect(out).not.toContain("小明 的警告單")
  })
})
