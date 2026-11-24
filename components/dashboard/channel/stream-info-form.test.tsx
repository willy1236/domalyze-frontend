import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { StreamInfoForm } from "./stream-info-form"

vi.mock("./channel-access-guard", () => ({ useChannelError: () => () => false }))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

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

it.each(["owner", "mod"] as const)("GET scope_missing 顯示授權提示，%s 的入口符合角色", async (role) => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "scope_missing" }, { status: 409 })))
  await act(async () => root.render(<StreamInfoForm channelId="777" role={role} readOnly={false} />))
  expect(container.querySelector("[role=alert]")?.textContent).toContain("重新授權")
  expect(Boolean(container.querySelector('a[href*="dashboard-twitch-enable"]'))).toBe(role === "owner")
})

it("分類未設定時只送修改的標題", async () => {
  const fetch = vi.fn(async (_input: string, init?: RequestInit) =>
    init?.method === "PUT"
      ? new Response(null, { status: 204 })
      : Response.json({ title: "舊標題", category_id: "", category_name: "", is_live: false, started_at: null, can_edit: true }),
  )
  vi.stubGlobal("fetch", fetch)
  await act(async () => root.render(<StreamInfoForm channelId="777" role="owner" readOnly={false} />))

  const title = container.querySelector<HTMLInputElement>('input[aria-label="標題"]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(title, "新標題")
    title.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  })

  const put = fetch.mock.calls.find(([, init]) => init?.method === "PUT")
  expect(JSON.parse(String(put?.[1]?.body))).toEqual({ title: "新標題" })
})
