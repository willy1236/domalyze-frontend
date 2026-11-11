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

describe("移除大廳但按鈕沒拿掉", () => {
  it("一覽重新載入後大廳列消失，說明仍留在畫面上，按關閉才重新載入", async () => {
    // 不 mock onDone：用真實的一覽重新載入。DELETE 之後，一覽就不再有這個大廳
    let removed = false
    let listCalls = 0
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const path = url.replace(/^.*\/dashboard/, "/dashboard")
        const method = init?.method ?? "GET"
        let body: unknown = { error: "not_found" }
        let status = 404
        if (method === "DELETE" && path === `${BASE}/lobbies/50`) {
          removed = true
          body = { removed: true, button_removed: false }
          status = 200
        } else if (method === "GET" && path === BASE) {
          listCalls += 1
          body = removed ? { lobbies: [], unassigned: [] } : LIST
          status = 200
        } else if (method === "GET" && path === `${BASE}/lobbies/50`) {
          body = { original: { name_prefix: "report" } }
          status = 200
        }
        return { ok: status < 400, status, json: async () => body } as Response
      }),
    )
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "")
    }
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open")
    }
    await act(async () => {
      root.render(<TicketLobbyManager guildId="1" />)
    })
    await flush()
    const callsBefore = listCalls

    await click(buttonByText("移除"))
    await click(buttonByText("確認移除"))
    // 說明在畫面上，大廳列也還在（一覽尚未重新載入）
    expect(container.textContent).toContain("開單按鈕還留在訊息上")
    expect(listCalls).toBe(callsBefore)

    await click(buttonByText("關閉"))
    // 關閉後才重新載入；大廳已不在一覽
    expect(listCalls).toBe(callsBefore + 1)
    expect(container.textContent).not.toContain("report")
    expect(container.textContent).toContain("目前沒有私人頻道大廳")
  })
})
