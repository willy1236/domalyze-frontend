import { afterEach, describe, expect, it, vi } from "vitest"
import { DashboardApiError, dashboardFetch } from "./dashboard-api"
import { exportErrorText, pollExportFilename } from "./dashboard-poll-export"

describe("pollExportFilename", () => {
  it("poll-<id>-<標題>.csv", () => {
    expect(pollExportFilename(12, "午餐吃什麼")).toBe("poll-12-午餐吃什麼.csv")
  })
  it("去掉檔名不允許的字元並收斂空白", () => {
    expect(pollExportFilename(1, 'a/b\\c:d*e?f"g<h>i|j\nk')).toBe("poll-1-a b c d e f g h i j k.csv")
  })
  it("標題全是不允許字元時只留 id", () => {
    expect(pollExportFilename(5, '///???')).toBe("poll-5.csv")
    expect(pollExportFilename(5, "")).toBe("poll-5.csv")
  })
  it("過長標題截斷，不拆壞代理對", () => {
    const name = pollExportFilename(1, "😀".repeat(80))
    expect(name).toBe(`poll-1-${"😀".repeat(50)}.csv`)
  })
  it("不以點開頭或結尾", () => {
    expect(pollExportFilename(1, "..hi..")).toBe("poll-1-hi.csv")
  })
})

describe("exportErrorText", () => {
  it("results_hidden 與預設", () => {
    expect(exportErrorText("results_hidden")).toContain("無法匯出")
    expect(exportErrorText(null)).toBe("匯出失敗，請稍後再試。")
  })
})

describe("dashboardFetch as blob", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("成功時回傳 Blob", async () => {
    const blob = new Blob(["a,b"], { type: "text/csv" })
    const res = { ok: true, status: 200, blob: async () => blob, json: async () => ({}) }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res))
    const result = await dashboardFetch("/x", {}, { as: "blob" })
    expect(result).toBe(blob)
  })

  it("錯誤仍走 JSON 錯誤處理（403 results_hidden）", async () => {
    const res = { ok: false, status: 403, json: async () => ({ error: "results_hidden" }) }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res))
    await expect(dashboardFetch("/x", {}, { as: "blob" })).rejects.toMatchObject({
      constructor: DashboardApiError,
      status: 403,
      code: "results_hidden",
      handled: false,
    })
  })
})
