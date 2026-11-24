/// <reference types="vite/client" />
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777", state: "enabled", role: "owner", mod_collab_enabled: true }),
  useChannelError: () => () => false,
  useReloadChannel: () => async () => {},
}))

const pages = import.meta.glob<{ default: React.ComponentType }>("./page.tsx")

const base = "/dashboard/channels/777/enforcement"
const timeout = {
  id: 11,
  at: "2026-11-23T10:00:00Z",
  user_id: "123",
  user_login: "alice",
  user_name: "Alice",
  filter: "link",
  strike: 2,
  action: "timeout",
  duration: 600,
  message: "timeout 的原訊息",
  status: "ok",
  lifted_at: null,
}
const deleted = {
  ...timeout,
  id: 12,
  user_id: "456",
  user_login: "bob",
  user_name: "Bob",
  strike: 1,
  action: "delete",
  duration: null,
  message: "只刪除的原訊息",
}
const failed = { ...deleted, id: 13, user_login: "carol", user_name: "Carol", message: "失敗的原訊息", status: "failed" }

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

type Reply = { status: number; body: unknown }

/** 清單回應的欄位名卡上沒定，替身同時給幾種常見命名；處置端點由 `actions` 依路徑回應。 */
async function openPage(rows: object[], actions: Record<string, Reply> = {}) {
  const calls: { method: string; path: string; body: unknown }[] = []
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input, "https://example.test").pathname
    const method = init?.method ?? "GET"
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (method === "GET") return Response.json({ entries: rows, logs: rows, enforcement: rows, items: rows, has_next: false })
    const reply = actions[path.replace(base, "")] ?? { status: 200, body: {} }
    return Response.json(reply.body, { status: reply.status })
  })
  vi.stubGlobal("fetch", fetch)
  const loadPage = pages["./page.tsx"]
  expect(loadPage, "執法紀錄頁尚未實作").toBeDefined()
  const { default: Page } = await loadPage()
  await act(async () => root.render(<Page />))
  expect(calls[0]).toMatchObject({ method: "GET" })
  expect(calls[0].path).toBe(base)
  return calls
}

function rowOf(text: string): HTMLElement {
  const row = [...container.querySelectorAll<HTMLElement>("tr, li, article, [role='row']")]
    .filter((el) => el.textContent?.includes(text))
    .at(-1)
  expect(row, `找不到包含「${text}」的列`).toBeDefined()
  return row!
}

function buttonIn(el: HTMLElement, label: string): HTMLButtonElement | undefined {
  return [...el.querySelectorAll("button")].find((b) => b.textContent?.includes(label))
}

async function click(el: HTMLElement | undefined) {
  expect(el).toBeDefined()
  await act(async () => el!.dispatchEvent(new MouseEvent("click", { bubbles: true })))
}

describe("執法紀錄頁", () => {
  it("列出時間、觀眾、過濾器、第幾次、動作與原訊息，失敗的執法標示失敗", async () => {
    await openPage([timeout, failed])
    const ok = rowOf("timeout 的原訊息").textContent!
    expect(ok).toContain("Alice")
    expect(ok).toContain("2")
    expect(ok).toContain("600")
    expect(ok).not.toContain("失敗")
    const bad = rowOf("失敗的原訊息").textContent!
    expect(bad).toContain("Carol")
    expect(bad).toContain("失敗")
  })

  it("只刪除訊息的紀錄沒有解除處罰的按鈕", async () => {
    await openPage([timeout, deleted])
    expect(buttonIn(rowOf("timeout 的原訊息"), "解除處罰")).toBeDefined()
    expect(buttonIn(rowOf("只刪除的原訊息"), "解除處罰")).toBeUndefined()
  })

  it("解除處罰成功後該列標示已解除", async () => {
    const calls = await openPage([timeout], { "/11/lift": { status: 200, body: { result: "lifted" } } })
    await click(buttonIn(rowOf("timeout 的原訊息"), "解除處罰"))
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: `${base}/11/lift` })
    expect(rowOf("timeout 的原訊息").textContent).toContain("已解除")
  })

  it("已到期時顯示已不在處罰中", async () => {
    await openPage([timeout], { "/11/lift": { status: 200, body: { result: "not_punished" } } })
    await click(buttonIn(rowOf("timeout 的原訊息"), "解除處罰"))
    expect(container.textContent).toContain("已不在處罰中")
  })

  it.each([
    { status: 503, code: "bot_offline" },
    { status: 500, code: "internal_error" },
  ])("解除處罰失敗（$code）時顯示失敗並保留按鈕可重試", async ({ status, code }) => {
    const calls = await openPage([timeout], { "/11/lift": { status, body: { error: code } } })
    await click(buttonIn(rowOf("timeout 的原訊息"), "解除處罰"))
    expect(container.textContent).toMatch(/失敗|無法/)
    const retry = buttonIn(rowOf("timeout 的原訊息"), "解除處罰")
    expect(retry).toBeDefined()
    expect(retry!.disabled).toBe(false)
    await click(retry)
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(2)
  })

  it("清除犯規次數呼叫對應端點", async () => {
    const calls = await openPage([deleted])
    await click(buttonIn(rowOf("只刪除的原訊息"), "清除犯規次數"))
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: `${base}/12/clear-strikes` })
  })

  it("加入常客呼叫對應端點，已是常客時顯示已是常客", async () => {
    const calls = await openPage([deleted], {
      "/12/regular": { status: 409, body: { error: "already_regular" } },
    })
    await click(buttonIn(rowOf("只刪除的原訊息"), "加入常客"))
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: `${base}/12/regular` })
    expect(container.textContent).toMatch(/已(?:經)?是.*常客/)
  })
})
