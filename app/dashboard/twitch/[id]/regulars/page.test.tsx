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

const url = "/dashboard/channels/777/regulars"
const alice = {
  user_id: "123",
  user_login: "alice",
  user_name: "Alice",
  created_at: "2026-11-23T10:00:00Z",
}

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

async function openPage(postError?: { status: number; code: string }) {
  let regulars: (typeof alice)[] = []
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    expect(new URL(input, "https://example.test").pathname).toBe(url)
    if (init?.method === "POST") {
      expect(JSON.parse(String(init.body))).toEqual({ login: "alice" })
      if (postError) return Response.json({ error: postError.code }, { status: postError.status })
      regulars = [alice]
      return Response.json(alice, { status: 201 })
    }
    return Response.json({ regulars })
  })
  vi.stubGlobal("fetch", fetch)
  const loadPage = pages["./page.tsx"]
  expect(loadPage, "常客頁尚未實作").toBeDefined()
  const { default: Page } = await loadPage()
  await act(async () => root.render(<Page />))
  expect(fetch).toHaveBeenCalled()
}

async function addAlice() {
  const input = container.querySelector("input")
  const form = container.querySelector("form")
  expect(input).not.toBeNull()
  expect(form).not.toBeNull()
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "alice")
    input!.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await act(async () => form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })))
}

describe("常客頁", () => {
  it("新增成功後名單顯示該觀眾", async () => {
    await openPage()
    expect(container.textContent).not.toContain("Alice")
    await addAlice()
    expect(container.textContent).toContain("Alice")
  })

  it.each([
    { status: 404, code: "user_not_found", message: "找不到" },
    { status: 409, code: "already_regular", message: /已(?:經)?是.*常客/ },
  ])("顯示 $code 對應的錯誤", async ({ status, code, message }) => {
    await openPage({ status, code })
    await addAlice()
    expect(container.textContent).toMatch(message)
  })
})