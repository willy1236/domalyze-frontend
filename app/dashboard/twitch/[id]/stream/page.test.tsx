/// <reference types="vite/client" />
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ role: "owner" as "owner" | "mod" }))

vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777", state: "enabled", role: access.role, mod_collab_enabled: true }),
  useChannelError: () => () => false,
  useReloadChannel: () => async () => {},
}))

// 實況資訊頁（C-09）：`GET stream-info`、`GET stream-info/categories?q=`、`PUT stream-info {title, category_id}`
const pages = import.meta.glob<{ default: React.ComponentType }>("./page.tsx")
const channel = "/dashboard/channels/777"
const infoPath = `${channel}/stream-info`
const categoriesPath = `${infoPath}/categories`

const OLD_TITLE = "原本的標題"
const OLD_GAME = { id: "509658", name: "Just Chatting" }
const MINECRAFT = { id: "27471", name: "Minecraft" }

type Call = { method: string; path: string; query: string; body: unknown }

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  access.role = "owner"
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

/** 回應欄位名卡上只定了 `can_edit`，替身同時給幾種常見命名；測試只看畫面上的文字與送出的請求。 */
function info(overrides: { can_edit?: boolean; live?: boolean; started_at?: string | null } = {}) {
  const live = overrides.live ?? false
  return {
    title: OLD_TITLE,
    category: OLD_GAME,
    category_id: OLD_GAME.id,
    category_name: OLD_GAME.name,
    game_id: OLD_GAME.id,
    game_name: OLD_GAME.name,
    is_live: live,
    live,
    started_at: live ? (overrides.started_at ?? new Date(Date.now() - 90 * 60_000).toISOString()) : null,
    can_edit: overrides.can_edit ?? true,
  }
}

async function openPage(body: unknown = info(), categories: { id: string; name: string }[] = [MINECRAFT]) {
  const calls: Call[] = []
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, "https://example.test")
    const method = init?.method ?? "GET"
    calls.push({ method, path: url.pathname, query: url.search, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (method === "GET" && url.pathname === infoPath) return Response.json(body)
    if (method === "GET" && url.pathname === categoriesPath) {
      return Response.json({ categories, items: categories, results: categories, data: categories })
    }
    if (method === "PUT" && url.pathname === infoPath) return Response.json({})
    throw new Error(`沒預期的請求：${method} ${url.pathname}`)
  })
  vi.stubGlobal("fetch", fetch)
  const loadPage = pages["./page.tsx"]
  expect(loadPage, "實況資訊頁尚未實作").toBeDefined()
  const { default: Page } = await loadPage()
  await act(async () => root.render(<Page />))
  return calls
}

const text = () => container.textContent ?? ""

function inputs() {
  return [...container.querySelectorAll<HTMLInputElement>("input:not([type=hidden]):not([type=checkbox]):not([type=radio])")]
}

function titleInput(): HTMLInputElement {
  const found = inputs().find((el) => el.value === OLD_TITLE) ?? inputs().find((el) => /標題/.test(el.getAttribute("aria-label") ?? el.placeholder))
  expect(found, "找不到標題欄位").toBeDefined()
  return found!
}

function categoryInput(): HTMLInputElement {
  const found = inputs().find((el) => el !== titleInput() && !el.disabled)
  expect(found, "找不到搜尋分類的欄位").toBeDefined()
  return found!
}

function buttonWith(label: RegExp): HTMLElement | undefined {
  return [...container.querySelectorAll<HTMLElement>("button, [role=option], li")].find((el) => label.test(el.textContent ?? ""))
}

async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

async function click(el: HTMLElement | undefined) {
  expect(el).toBeDefined()
  await act(async () => el!.dispatchEvent(new MouseEvent("click", { bubbles: true })))
}

const enableLinks = () => [...container.querySelectorAll<HTMLAnchorElement>("a")].filter((a) => (a.getAttribute("href") ?? "").includes("dashboard-twitch-enable"))

describe("實況資訊頁", () => {
  it("顯示目前標題、分類，沒開台時顯示未開台", async () => {
    const calls = await openPage(info({ live: false }))
    expect(calls.filter((c) => c.method === "GET" && c.path === infoPath)).toHaveLength(1)
    expect(text()).toContain(OLD_TITLE)
    expect(text()).toContain(OLD_GAME.name)
    expect(text()).toContain("未開台")
  })

  it("開台中顯示開台狀態，不顯示未開台", async () => {
    await openPage(info({ live: true }))
    expect(text()).toContain("開台")
    expect(text()).not.toContain("未開台")
  })

  it("改標題、搜尋並選擇分類後儲存：PUT 送出 {title, category_id}", async () => {
    const calls = await openPage()
    await type(titleInput(), "新標題 abc")
    await type(categoryInput(), "mine")
    const search = calls.find((c) => c.path === categoriesPath)
    expect(search, "輸入關鍵字後應向後台搜尋分類").toBeDefined()
    expect(new URLSearchParams(search!.query).get("q")).toBe("mine")
    await click(buttonWith(new RegExp(MINECRAFT.name)))
    await click(buttonWith(/儲存/))
    expect(calls.find((c) => c.method === "PUT")).toMatchObject({
      path: infoPath,
      body: { title: "新標題 abc", category_id: MINECRAFT.id },
    })
  })

  it("沒有重新授權、實況主：頁面照常顯示資訊，不能修改，有重新授權入口", async () => {
    await openPage(info({ can_edit: false }))
    expect(text()).toContain(OLD_TITLE)
    expect(text()).toContain(OLD_GAME.name)
    const save = buttonWith(/儲存/) as HTMLButtonElement | undefined
    expect(save === undefined || save.disabled).toBe(true)
    expect(inputs().every((el) => el.disabled || el.readOnly)).toBe(true)
    expect(enableLinks()).toHaveLength(1)
  })

  it("沒有重新授權、mod：只看到提示，沒有重新授權入口，不能修改", async () => {
    access.role = "mod"
    await openPage(info({ can_edit: false }))
    expect(text()).toContain(OLD_TITLE)
    expect(text()).toMatch(/重新授權/)
    expect(enableLinks()).toHaveLength(0)
    const save = buttonWith(/儲存/) as HTMLButtonElement | undefined
    expect(save === undefined || save.disabled).toBe(true)
  })

  it("有改標題權限時不顯示重新授權入口，儲存可按", async () => {
    await openPage(info({ can_edit: true }))
    expect(enableLinks()).toHaveLength(0)
    const save = buttonWith(/儲存/) as HTMLButtonElement | undefined
    expect(save).toBeDefined()
  })

  it("mod 在協作開啟時能修改：有改標題權限的 mod 看得到可用的欄位", async () => {
    access.role = "mod"
    await openPage(info({ can_edit: true }))
    expect(titleInput().disabled || titleInput().readOnly).toBe(false)
  })
})
