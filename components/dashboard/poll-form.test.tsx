import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PollForm } from "./poll-form"
import type { PollOptions } from "@/lib/dashboard-poll-create"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const OPTIONS: PollOptions = {
  channels: [
    { id: "50", name: "公告", type: "text", category: "資訊", disabled_reason: null },
    { id: "51", name: "唯讀", type: "text", category: "資訊", disabled_reason: "星羽沒有發言權限" },
  ],
  roles: [
    { id: "7", name: "成員", color: 0 },
    { id: "8", name: "管理組", color: 0 },
  ],
}

const BASE = "/dashboard/guilds/1/polls"
let calls: { method: string; path: string; body: Record<string, unknown> | null }[]
let responses: Record<string, { status: number; body: unknown }>
let container: HTMLDivElement
let root: Root

async function flush() {
  for (let i = 0; i < 5; i++)
    await act(async () => {
      await Promise.resolve()
    })
}

function change(el: Element, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }))
  })
}
const click = async (el: Element) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
  await flush()
}
const submit = async () => {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  })
  await flush()
}
const byId = (id: string) => document.getElementById(id) as HTMLInputElement
const byLabel = (label: string) => container.querySelector(`[aria-label="${label}"]`) as HTMLInputElement
const button = (t: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(t)) as HTMLButtonElement
const text = () => container.textContent ?? ""

async function fillValid() {
  change(byId("poll-channel"), "50")
  change(byId("poll-title"), "午餐吃什麼")
  const inputs = [...container.querySelectorAll<HTMLInputElement>('input[id^="poll-option-"]')]
  change(inputs[0], "拉麵")
  change(inputs[1], "咖哩")
}

beforeEach(() => {
  push.mockReset()
  calls = []
  responses = {
    [`GET ${BASE}/options`]: { status: 200, body: OPTIONS },
    [`POST ${BASE}`]: { status: 200, body: { poll_id: 9, message_url: "u" } },
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET"
      const path = url.replace(/^.*\/dashboard/, "/dashboard")
      calls.push({ method, path, body: typeof init?.body === "string" ? JSON.parse(init.body) : null })
      const res = responses[`${method} ${path}`] ?? { status: 404, body: {} }
      return { ok: res.status < 400, status: res.status, json: async () => res.body } as Response
    }),
  )
  vi.spyOn(console, "error").mockImplementation(() => {})
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function mount() {
  await act(async () => {
    root.render(<PollForm guildId="1" />)
  })
  await flush()
}

describe("PollForm", () => {
  it("不能發言的頻道停用並標示原因", async () => {
    await mount()
    const opt = [...container.querySelectorAll("option")].find((o) => o.textContent?.includes("唯讀"))!
    expect(opt.disabled).toBe(true)
    expect(opt.textContent).toContain("星羽沒有發言權限")
  })

  it("標題與選項顯示字數", async () => {
    await mount()
    change(byId("poll-title"), "午餐")
    expect(text()).toContain("2／45")
    change(byId("poll-option-0"), "拉麵")
    expect(text()).toContain("2／80")
  })

  it("選項最多 20 列", async () => {
    await mount()
    for (let i = 0; i < 25; i++) if (!button("新增選項").disabled) await click(button("新增選項"))
    expect(container.querySelectorAll('input[id^="poll-option-"]').length).toBe(20)
    expect(button("新增選項").disabled).toBe(true)
  })

  it("選項重複時擋下，指出欄位，不送出", async () => {
    await mount()
    await fillValid()
    change(byId("poll-option-1"), "拉麵")
    await submit()
    expect(text()).toContain("選項重複")
    expect(calls.some((c) => c.method === "POST")).toBe(false)
  })

  it("權重超出範圍時擋下", async () => {
    await mount()
    await fillValid()
    await click(button("新增權重"))
    change(byLabel("權重身分組 1"), "7")
    change(byLabel("權重 1"), "11")
    await submit()
    expect(text()).toContain("權重要在 1 到 10 之間")
    expect(calls.some((c) => c.method === "POST")).toBe(false)
  })

  it("送出成功導到詳細頁", async () => {
    await mount()
    await fillValid()
    await submit()
    const post = calls.find((c) => c.method === "POST")!
    expect(post.body).toMatchObject({ channel_id: "50", title: "午餐吃什麼", options: ["拉麵", "咖哩"], number_of_user_votes: 1 })
    expect(push).toHaveBeenCalledWith("/dashboard/guilds/1/polls/9")
  })

  it("截止時間：過去的時間擋下，可清除，未填不送", async () => {
    await mount()
    await fillValid()
    expect(button("清除")).toBeUndefined()
    change(byId("poll-deadline"), "2020-01-01T00:00")
    expect(button("清除")).toBeDefined()
    await submit()
    expect(text()).toContain("截止時間必須晚於現在")
    expect(calls.some((c) => c.method === "POST")).toBe(false)
    await click(button("清除"))
    expect(byId("poll-deadline").value).toBe("")
    await submit()
    expect(calls.find((c) => c.method === "POST")!.body).not.toHaveProperty("deadline")
  })

  it("截止時間送出帶 +08:00", async () => {
    await mount()
    await fillValid()
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000 + 8 * 3600 * 1000).toISOString().slice(0, 16)
    change(byId("poll-deadline"), d)
    await submit()
    expect(calls.find((c) => c.method === "POST")!.body).toMatchObject({ deadline: `${d}:00+08:00` })
  })

  it("後端欄位錯誤顯示在欄位上", async () => {
    responses[`POST ${BASE}`] = {
      status: 400,
      body: { error: "invalid_request", fields: [{ path: "channel_id", reason: "你不能在這個頻道發言" }] },
    }
    await mount()
    await fillValid()
    await submit()
    expect(text()).toContain("你不能在這個頻道發言")
    expect(push).not.toHaveBeenCalled()
  })

  it("發送失敗顯示原因並可再送", async () => {
    responses[`POST ${BASE}`] = {
      status: 400,
      body: { error: "poll_send_failed", message_failure: "failed", message_failure_text: "Discord 拒絕了訊息" },
    }
    await mount()
    await fillValid()
    await submit()
    expect(text()).toContain("Discord 拒絕了訊息")
    expect(button("發起").disabled).toBe(false)
  })
})
