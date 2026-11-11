import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { parseSheet, WarningSheet } from "./warning-sheet"
import type { WarningRecord } from "@/lib/dashboard-warnings"

const description =
  "**編號：1（警告）**\n- 被警告用戶：<@1>\n- 管理員：精神時光屋/<@2>\n- 原因：測試\n- 時間：2026-11-10 17:05:00\n- 官方認證警告\n- 伺服器內警告"

const record: WarningRecord = {
  id: 1,
  kind: "warning",
  target: { id: "1", name: "小明", avatar_url: "https://cdn/1.png", left: false },
  moderator: { id: "2", name: null, avatar_url: null, left: true },
  reason: "測試",
  created_at: "2026-11-10T09:05:00Z",
  duration_seconds: null,
  cross_guild: false,
  this_guild: true,
  sheet: { title: "grimm 的警告單", description },
}

describe("parseSheet", () => {
  it("拆成標題、欄位與無冒號的徽章", () => {
    const rows = parseSheet(description)
    expect(rows[0]).toEqual({ kind: "heading", text: "編號：1（警告）" })
    expect(rows[1]).toEqual({ kind: "field", label: "被警告用戶", value: "<@1>" })
    expect(rows.filter((r) => r.kind === "badge").map((r) => (r as { text: string }).text)).toEqual(["官方認證警告", "伺服器內警告"])
  })
})

describe("WarningSheet", () => {
  const out = renderToStaticMarkup(<WarningSheet record={record} id="x" />)
  it("mention 顯示成 @名稱，已離開的成員標示，不留原始標記", () => {
    expect(out).toContain("@小明")
    expect(out).toContain("@已離開的成員")
    expect(out).not.toContain("&lt;@")
    expect(out).not.toContain("**")
  })
  it("資訊完整：標題、編號、原因、時間與徽章", () => {
    for (const t of ["grimm 的警告單", "編號：1（警告）", "測試", "2026-11-10 17:05:00", "官方認證警告", "伺服器內警告"]) {
      expect(out).toContain(t)
    }
  })
})
