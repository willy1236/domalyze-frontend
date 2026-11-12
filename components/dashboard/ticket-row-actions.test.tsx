import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { TicketItem } from "@/lib/dashboard-tickets"
import { TicketLobbyManager } from "./ticket-lobby-manager"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const BASE = "/dashboard/guilds/1/tickets"
const ticket = (id: string, status: "open" | "locked"): TicketItem => ({
  channel: { id, name: `report-${id}` },
  jump_url: "u",
  creator: { id: "9", name: "Alice" },
  created_at: "2026-11-11T00:00:00+00:00",
  number: 1,
  status,
  closer: status === "locked" ? { id: "8", name: "Bob" } : null,
  closed_at: status === "locked" ? "2026-11-12T00:00:00+00:00" : null,
})

/** 伺服器端的狀態：每個請求都依目前狀態回應 */
let tickets: TicketItem[]
let unassigned: TicketItem[]
let calls: { method: string; path: string }[]
let failWith: { status: number; code: string } | null

const list = () => ({
  lobbies: [
    {
      channel: { id: "50", name: "開單", invalid: false },
      jump_url: "u",
      message_invalid: false,
      category: { id: "70", name: "客服區", invalid: false },
      invalid_reason: null,
      manager_roles: [],
      name_prefix: "report",
      one_per_user: true,
      max_open: null,
      ticket_count: tickets.length,
      locked_count: tickets.filter((t) => t.status === "locked").length,
      permission_issues: [],
      tickets,
    },
  ],
  unassigned,
})

let container: HTMLDivElement
let root: Root

async function flush() {
  for (let i = 0; i < 6; i++)
    await act(async () => {
      await Promise.resolve()
    })
}
const click = async (el: Element) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
  await flush()
}
const button = (label: string) =>
  [...container.querySelectorAll("button")].find(
    (b) => b.getAttribute("aria-label") === label || b.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined

beforeEach(async () => {
  tickets = [ticket("101", "open"), ticket("102", "locked")]
  unassigned = [ticket("103", "locked")]
  calls = []
  failWith = null
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/^.*\/dashboard/, "/dashboard")
      const method = init?.method ?? "GET"
      calls.push({ method, path })
      if (method === "GET" && path === BASE) return { ok: true, status: 200, json: async () => list() } as Response
      const m = path.match(/\/channels\/(\d+)(?:\/(lock|reopen))?$/)
      if (m) {
        if (failWith) {
          return { ok: false, status: failWith.status, json: async () => ({ error: failWith!.code }) } as Response
        }
        const [, id, action] = m
        const all = [...tickets, ...unassigned]
        const target = all.find((t) => t.channel.id === id)
        if (method === "DELETE") {
          tickets = tickets.filter((t) => t.channel.id !== id)
          unassigned = unassigned.filter((t) => t.channel.id !== id)
        } else if (target) {
          target.status = action === "lock" ? "locked" : "open"
        }
        const status = method === "DELETE" ? "deleted" : action === "lock" ? "locked" : "open"
        return { ok: true, status: 200, json: async () => ({ channel_id: id, status, changed: true }) } as Response
      }
      return { ok: false, status: 404, json: async () => ({ error: "not_found" }) } as Response
    }),
  )
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "")
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open")
  }
  vi.spyOn(console, "error").mockImplementation(() => {})
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<TicketLobbyManager guildId="1" />)
  })
  await flush()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const actionCalls = () => calls.filter((c) => c.method !== "GET")
const listLoads = () => calls.filter((c) => c.method === "GET" && c.path === BASE).length

describe("私人頻道列的動作", () => {
  it("開啟中的有鎖定與刪除，已鎖定的有重開與刪除（含未歸屬）", () => {
    expect(button("鎖定 #report-101")).toBeTruthy()
    expect(button("重開 #report-101")).toBeUndefined()
    expect(button("重開 #report-102")).toBeTruthy()
    expect(button("鎖定 #report-102")).toBeUndefined()
    expect(button("重開 #report-103")).toBeTruthy()
    for (const id of ["101", "102", "103"]) expect(button(`刪除 #report-${id}`)).toBeTruthy()
  })

  it("鎖定後清單重新載入並顯示已鎖定", async () => {
    const before = listLoads()
    await click(button("鎖定 #report-101")!)
    expect(actionCalls()).toEqual([{ method: "POST", path: `${BASE}/channels/101/lock` }])
    expect(listLoads()).toBe(before + 1)
    expect(button("重開 #report-101")).toBeTruthy()
  })

  it("重開打 reopen 端點", async () => {
    await click(button("重開 #report-102")!)
    expect(actionCalls()).toEqual([{ method: "POST", path: `${BASE}/channels/102/reopen` }])
    expect(button("鎖定 #report-102")).toBeTruthy()
  })

  it("刪除先出現確認視窗並寫明對話無法復原，確認後刪除並從清單消失", async () => {
    await click(button("刪除 #report-102")!)
    const dialog = [...container.querySelectorAll("dialog")].find((d) => d.hasAttribute("open"))!
    expect(dialog.textContent).toContain("對話無法復原")
    expect(dialog.textContent).toContain("#report-102")
    expect(actionCalls()).toEqual([])

    await click([...dialog.querySelectorAll("button")].find((b) => b.textContent === "確認刪除")!)
    expect(actionCalls()).toEqual([{ method: "DELETE", path: `${BASE}/channels/102` }])
    expect(container.textContent).not.toContain("report-102")
  })

  it("取消刪除不送出請求", async () => {
    await click(button("刪除 #report-101")!)
    const dialog = [...container.querySelectorAll("dialog")].find((d) => d.hasAttribute("open"))!
    await click([...dialog.querySelectorAll("button")].find((b) => b.textContent === "取消")!)
    expect(dialog.hasAttribute("open")).toBe(false)
    expect(actionCalls()).toEqual([])
  })

  it("bot 缺權限時顯示說明，清單不變", async () => {
    failWith = { status: 400, code: "bot_missing_permission" }
    const before = listLoads()
    await click(button("鎖定 #report-101")!)
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Manage Roles")
    expect(listLoads()).toBe(before)
  })

  it("頻道已不在（not_found）時重新載入清單", async () => {
    failWith = { status: 404, code: "not_found" }
    const before = listLoads()
    await click(button("鎖定 #report-101")!)
    expect(listLoads()).toBe(before + 1)
  })
})
