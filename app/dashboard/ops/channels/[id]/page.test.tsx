/// <reference types="vite/client" />
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "777" }) }))

const pages = import.meta.glob<{ default: React.ComponentType }>("./page.tsx")

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

const row = {
  id: 11,
  at: "2026-11-23T10:00:00Z",
  user_id: "123",
  user_login: "alice",
  user_name: "Alice",
  filter: "link",
  strike: 2,
  action: "timeout",
  duration: 600,
  message: "營運入口看得到的原訊息",
  status: "ok",
  lifted_at: null,
}

it("營運入口的頻道頁向 ops 端點取執法紀錄並列出", async () => {
  const paths: string[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const path = new URL(input, "https://example.test").pathname
      paths.push(path)
      if (path === "/dashboard/ops/channels/777/enforcement") {
        // 清單回應的欄位名卡上沒定，同時給幾種常見命名
        return Response.json({ entries: [row], logs: [row], enforcement: [row], items: [row], has_next: false })
      }
      return Response.json({
        channel: { id: "777", name: "Bravo", state: "enabled" },
        page: 1,
        has_next: false,
        entries: [],
      })
    }),
  )
  const loadPage = pages["./page.tsx"]
  expect(loadPage, "營運入口頻道頁不存在").toBeDefined()
  const { default: Page } = await loadPage()
  await act(async () => root.render(<Page />))

  expect(paths).toContain("/dashboard/ops/channels/777/enforcement")
  expect(container.textContent).toContain("營運入口看得到的原訊息")
  expect(container.textContent).toContain("Alice")
})
