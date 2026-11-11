import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TicketLobbyManager } from "./ticket-lobby-manager"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const BASE = "/dashboard/guilds/1/tickets"
const LIST = {
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
      ticket_count: 0,
      locked_count: 0,
      permission_issues: [],
      tickets: [],
    },
  ],
  unassigned: [],
}
const OPTIONS = { channels: [], categories: [], roles: [], emojis: [] }

let container: HTMLDivElement
let root: Root
let paths: string[]

async function flush() {
  for (let i = 0; i < 5; i++)
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
const buttonByText = (t: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(t)) as HTMLButtonElement

beforeEach(async () => {
  paths = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const path = url.replace(/^.*\/dashboard/, "/dashboard")
      paths.push(path)
      const body = path === BASE ? LIST : path === `${BASE}/options` ? OPTIONS : null
      return { ok: body !== null, status: body ? 200 : 404, json: async () => body ?? { error: "not_found" } } as Response
    }),
  )
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

describe("TicketLobbyManager", () => {
  it("一覽的標題列有新增大廳，按下開啟空白表單", async () => {
    expect(container.querySelector("form")).toBeNull()
    await click(buttonByText("新增大廳"))
    expect(container.querySelector("form")?.getAttribute("aria-label")).toBe("新增私人頻道大廳")
  })

  it("每個大廳有編輯與移除，編輯載入那個大廳的設定", async () => {
    expect(buttonByText("移除")).toBeTruthy()
    await click(buttonByText("編輯"))
    expect(container.querySelector("form")?.getAttribute("aria-label")).toBe("編輯私人頻道大廳")
    expect(paths).toContain(`${BASE}/lobbies/50`)
  })

  it("取消關閉表單", async () => {
    await click(buttonByText("新增大廳"))
    await click(buttonByText("取消"))
    expect(container.querySelector("form")).toBeNull()
  })
})
