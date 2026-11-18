import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { PollDetail } from "@/lib/dashboard-polls"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { PollActions } from "./poll-actions"

const detail = (over: { status?: "active" | "ended"; can_manage?: boolean }): PollDetail =>
  ({
    id: 5,
    title: "午餐",
    status: over.status ?? "active",
    viewer: { role: "creator", can_manage: over.can_manage ?? true },
  }) as PollDetail

const render = (d: PollDetail) => renderToStaticMarkup(<PollActions guildId="1" detail={d} onChanged={() => {}} />)

describe("PollActions", () => {
  it("不能管理時不顯示", () => {
    expect(render(detail({ can_manage: false }))).toBe("")
  })
  it("進行中顯示結算與刪除，刪除確認寫明無法復原", () => {
    const out = render(detail({}))
    expect(out).toContain("結算")
    expect(out).toContain("刪除")
    expect(out).toContain("無法復原")
  })
  it("已結算只剩刪除", () => {
    const out = render(detail({ status: "ended" }))
    expect(out).not.toContain(">結算<")
    expect(out).toContain(">刪除<")
  })
})
