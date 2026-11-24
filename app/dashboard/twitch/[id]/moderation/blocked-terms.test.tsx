/// <reference types="vite/client" />
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777", state: "enabled", role: "owner", mod_collab_enabled: true }),
  useChannelError: () => () => false,
  useReloadChannel: () => async () => {},
}))

// 聊天室管理頁的「Twitch Blocked Terms」區塊（C-07）
const pages = import.meta.glob<{ default: React.ComponentType }>("./page.tsx")
const channel = "/dashboard/channels/777"
const termsPath = `${channel}/blocked-terms`

const kinds = ["link", "blocked_word", "caps", "emote", "symbol", "repetition", "length", "duplicate"]
const settings = {
  stages: [{ action: "delete", duration: null }],
  strike_reset_minutes: 60,
  raid_pause_seconds: 120,
  permit_seconds: 60,
  updated_at: null,
}
const filters = kinds.map((kind) => ({
  kind,
  enabled: false,
  exempt_level: "vip",
  params: {},
  notice: null,
  silent: false,
  stages: null,
  updated_at: null,
}))

type Term = { id: string; text: string }
type Reply = { status: number; body: unknown }

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

/** 清單回應的欄位名卡上沒定，替身同時給幾種常見命名。`replies` 依序消耗，用完後回最後一筆。 */
async function openPage(replies: Reply[], mutations: Record<string, Reply> = {}) {
  const calls: { method: string; path: string; body: unknown }[] = []
  let listed = 0
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input, "https://example.test").pathname
    const method = init?.method ?? "GET"
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (path === `${channel}/moderation`) return Response.json({ settings, filters })
    if (method === "GET") {
      expect(path).toBe(termsPath)
      const reply = replies[Math.min(listed++, replies.length - 1)]
      return Response.json(reply.body, { status: reply.status })
    }
    const reply = mutations[`${method} ${path}`] ?? { status: 200, body: {} }
    return Response.json(reply.body, { status: reply.status })
  })
  vi.stubGlobal("fetch", fetch)
  const loadPage = pages["./page.tsx"]
  expect(loadPage, "聊天室管理頁尚未實作").toBeDefined()
  const { default: Page } = await loadPage()
  await act(async () => root.render(<Page />))
  return calls
}

function listOf(terms: Term[]): Reply {
  return { status: 200, body: { terms, blocked_terms: terms, items: terms, entries: terms, data: terms } }
}

function section(): HTMLElement {
  const heading = [...container.querySelectorAll<HTMLElement>("h2, h3, h4, h5, h6, [role=heading]")].find((el) =>
    /Blocked Terms/i.test(el.textContent ?? ""),
  )
  expect(heading, "找不到「Twitch Blocked Terms」區塊標題").toBeDefined()
  let node = heading!.parentElement
  while (node && node !== container && !(node.textContent ?? "").match(/新增|無法|mod|重試|重新載入/)) node = node.parentElement
  expect(node).toBeTruthy()
  return node!
}

function rowOf(text: string): HTMLElement {
  const row = [...section().querySelectorAll<HTMLElement>("tr, li, article, [role='row']")]
    .filter((el) => el.textContent?.includes(text))
    .at(-1)
  expect(row, `找不到包含「${text}」的列`).toBeDefined()
  return row!
}

function buttonIn(el: HTMLElement, label: RegExp): HTMLButtonElement | undefined {
  return [...el.querySelectorAll("button")].find((b) => label.test(b.textContent ?? ""))
}

async function click(el: HTMLElement | undefined) {
  expect(el).toBeDefined()
  await act(async () => el!.dispatchEvent(new MouseEvent("click", { bubbles: true })))
}

async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("Twitch Blocked Terms 區塊", () => {
  it("列出 Twitch 上目前的詞", async () => {
    const calls = await openPage([listOf([{ id: "t-1", text: "壞詞" }, { id: "t-2", text: "另一個" }])])
    expect(calls.filter((c) => c.method === "GET" && c.path === termsPath)).toHaveLength(1)
    expect(section().textContent).toContain("壞詞")
    expect(section().textContent).toContain("另一個")
  })

  it("新增詞：送出文字到後台並重新載入清單", async () => {
    const calls = await openPage(
      [listOf([]), listOf([{ id: "t-9", text: "新詞" }])],
      { [`POST ${termsPath}`]: { status: 200, body: {} } },
    )
    const input = section().querySelector<HTMLInputElement>("input[type=text], input:not([type])")
    expect(input, "找不到輸入詞的欄位").not.toBeNull()
    await type(input!, "新詞")
    await click(buttonIn(section(), /新增/))
    expect(calls.find((c) => c.method === "POST")).toMatchObject({ path: termsPath, body: { text: "新詞" } })
    expect(section().textContent).toContain("新詞")
  })

  it("刪除詞：以詞的 id 呼叫刪除端點，清單不再有該詞", async () => {
    const calls = await openPage([
      listOf([{ id: "t-1", text: "留著" }, { id: "t-2", text: "要刪" }]),
      listOf([{ id: "t-1", text: "留著" }]),
    ])
    await click(buttonIn(rowOf("要刪"), /刪除/))
    expect(calls.find((c) => c.method === "DELETE")).toMatchObject({ path: `${termsPath}/t-2` })
    expect(section().textContent).toContain("留著")
    expect(section().textContent).not.toContain("要刪")
  })

  it("bot 不是頻道 mod：不顯示清單與新增，只顯示原因", async () => {
    await openPage([{ status: 409, body: { error: "bot_not_mod" } }])
    const text = section().textContent!
    expect(text).toMatch(/mod/i)
    expect(buttonIn(section(), /新增/)).toBeUndefined()
    expect(section().querySelector("input")).toBeNull()
  })

  it("Twitch bot 離線：顯示目前無法讀取，重試後載入清單", async () => {
    const calls = await openPage([
      { status: 503, body: { error: "bot_offline" } },
      listOf([{ id: "t-1", text: "壞詞" }]),
    ])
    expect(section().textContent).toContain("無法讀取")
    expect(section().textContent).not.toContain("壞詞")
    await click(buttonIn(section(), /重試|重新載入/))
    expect(calls.filter((c) => c.method === "GET" && c.path === termsPath)).toHaveLength(2)
    expect(section().textContent).toContain("壞詞")
  })
})
