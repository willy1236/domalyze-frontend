import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TicketLobbyForm } from "./ticket-lobby-form"
import { TicketLobbyRemoveButton } from "./ticket-lobby-remove-button"
import type { LobbyDetail, LobbyOptions, TicketLobby } from "@/lib/dashboard-tickets"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const OPTIONS: LobbyOptions = {
  channels: [
    { id: "50", name: "開單", category: "客服", permission_issues: [] },
    {
      id: "51",
      name: "公告",
      category: "客服",
      permission_issues: [{ permission: "Send Messages", target: "lobby_channel", consequence: "無法發送大廳訊息" }],
    },
  ],
  categories: [
    { id: "70", name: "客服區", permission_issues: [] },
    {
      id: "71",
      name: "檢舉區",
      permission_issues: [{ permission: "Manage Roles", target: "category", consequence: "無法設定私人頻道的可見範圍" }],
    },
  ],
  roles: [
    { id: "1", name: "客服人員", color: 0, disabled_reason: null },
    { id: "2", name: "管理組", color: 0, disabled_reason: null },
    { id: "3", name: "整合", color: 0, disabled_reason: "無法選擇 @everyone 或由整合服務管理的身分組" },
  ],
  emojis: [{ id: "700", name: "ok", animated: false, value: "<:ok:700>" }],
}

const ORIGINAL = {
  ticket_category_id: "70",
  name_prefix: "report",
  one_per_user: true,
  max_open: null,
  content_json: null,
  button_label: null,
  button_emoji: null,
  manager_role_ids: ["1"],
}

const DETAIL: LobbyDetail = {
  channel: { id: "50", name: "開單" },
  invalid_reason: null,
  ticket_category_id: "70",
  manager_role_ids: ["1"],
  name_prefix: "report",
  one_per_user: true,
  max_open: null,
  content: { content: null, embed: { ...emptyEmbed(), description: "點擊下方按鈕以建立私人頻道" } },
  button_label: null,
  button_emoji: null,
  original: ORIGINAL,
}

function emptyEmbed() {
  return {
    title: null,
    url: null,
    description: null,
    color: null,
    author: null,
    fields: [],
    image_url: null,
    thumbnail_url: null,
    footer: null,
    extra: {},
  }
}

const BASE = "/dashboard/guilds/1/tickets"

interface Call {
  method: string
  path: string
  body: Record<string, unknown> | null
}

let calls: Call[]
let responses: Record<string, { status: number; body: unknown }>
let container: HTMLDivElement
let root: Root

function stubFetch() {
  calls = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null
      const path = url.replace(/^.*\/dashboard/, "/dashboard")
      calls.push({ method, path, body })
      const res = responses[`${method} ${path}`] ?? { status: 404, body: { error: "not_found" } }
      return { ok: res.status < 400, status: res.status, json: async () => res.body } as Response
    }),
  )
}

async function flush() {
  for (let i = 0; i < 5; i++)
    await act(async () => {
      await Promise.resolve()
    })
}

function change(el: Element, value: string) {
  const proto =
    el instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
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
const text = () => container.textContent ?? ""
const buttonByText = (t: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(t)) as HTMLButtonElement
const field = (label: string) =>
  [...container.querySelectorAll("label")]
    .filter((l) => l.textContent?.startsWith(label))
    .map((l) => document.getElementById(l.htmlFor) as HTMLInputElement | HTMLSelectElement)[0]
const checkbox = (label: string) =>
  [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((c) =>
    c.closest("label")?.textContent?.includes(label),
  )!
const submit = async () => {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  })
  await flush()
}

async function mountForm(props: Partial<React.ComponentProps<typeof TicketLobbyForm>> = {}) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  await act(async () => {
    root.render(<TicketLobbyForm guildId="1" lobby={null} onClose={onClose} onSaved={onSaved} {...props} />)
  })
  await flush()
  return { onClose, onSaved }
}

beforeEach(() => {
  // jsdom 沒有實作 <dialog> 的 showModal／close
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "")
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open")
  }
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  responses = {
    [`GET ${BASE}/options`]: { status: 200, body: OPTIONS },
    [`GET ${BASE}/lobbies/50`]: { status: 200, body: DETAIL },
  }
  stubFetch()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("TicketLobbyForm：新增", () => {
  it("沒選頻道與分類時不送出，並指出原因", async () => {
    const { onSaved } = await mountForm()
    await submit()
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0)
    expect(text()).toContain("請選擇大廳頻道")
    expect(text()).toContain("請選擇私人頻道所在的分類")
    expect(onSaved).not.toHaveBeenCalled()
  })

  it("前綴處理後不合格時不送出", async () => {
    await mountForm()
    change(field("頻道名稱前綴"), "!!!")
    change(field("大廳頻道"), "50")
    change(field("私人頻道所在的分類"), "70")
    await submit()
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0)
    expect(text()).toContain("處理後必須是 1 到 20 個字元")
  })

  it("填好設定後送出正確的內容，成功後關閉並通知重新載入", async () => {
    responses[`POST ${BASE}/lobbies`] = {
      status: 200,
      body: { channel_id: "50", message_id: "900", jump_url: "u", failures: [] },
    }
    const { onSaved, onClose } = await mountForm()
    change(field("大廳頻道"), "50")
    change(field("私人頻道所在的分類"), "70")
    await click(checkbox("客服人員"))
    change(field("頻道名稱前綴"), "Report Case")
    change(field("同時開啟上限"), "3")
    await click(checkbox("每人在這個大廳同時只能有一張"))
    change(field("開單按鈕文字"), "開單")
    change(field("開單按鈕 emoji"), "<:ok:700>")
    await submit()
    const post = calls.find((c) => c.method === "POST")!
    expect(post.body).toMatchObject({
      lobby_channel: { kind: "existing", id: "50" },
      ticket_category_id: "70",
      manager_role_ids: ["1"],
      name_prefix: "Report Case",
      one_per_user: false,
      max_open: 3,
      button_label: "開單",
      button_emoji: "<:ok:700>",
    })
    expect((post.body?.message as { embed: { description: string } }).embed.description).toContain("點擊下方按鈕")
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("讓星羽新建頻道時送出 kind new", async () => {
    responses[`POST ${BASE}/lobbies`] = {
      status: 200,
      body: { channel_id: "99", message_id: "900", jump_url: "u", failures: [] },
    }
    await mountForm()
    await click(container.querySelector<HTMLInputElement>('input[type="radio"][value="new"]')!)
    change(field("新頻道名稱"), "新大廳")
    change(field("新頻道所在的分類"), "70")
    change(field("私人頻道所在的分類"), "70")
    await submit()
    expect(calls.find((c) => c.method === "POST")!.body?.lobby_channel).toEqual({
      kind: "new",
      name: "新大廳",
      category_id: "70",
    })
  })

  it("權限不足顯示警告，仍然可以送出", async () => {
    responses[`POST ${BASE}/lobbies`] = {
      status: 200,
      body: { channel_id: "51", message_id: "900", jump_url: "u", failures: [] },
    }
    const { onSaved } = await mountForm()
    change(field("大廳頻道"), "51")
    change(field("私人頻道所在的分類"), "71")
    expect(text()).toContain("缺少 Send Messages")
    expect(text()).toContain("缺少 Manage Roles")
    await submit()
    expect(onSaved).toHaveBeenCalled()
  })

  it("不能選的身分組停用並說明原因", async () => {
    await mountForm()
    expect(checkbox("整合").disabled).toBe(true)
    expect(text()).toContain("無法選擇 @everyone")
  })

  it("後端回報欄位錯誤時顯示在對應欄位", async () => {
    responses[`POST ${BASE}/lobbies`] = {
      status: 400,
      body: { error: "invalid_request", fields: [{ path: "lobby_channel", reason: "這個頻道已經是大廳" }] },
    }
    const { onSaved } = await mountForm()
    change(field("大廳頻道"), "50")
    change(field("私人頻道所在的分類"), "70")
    await submit()
    expect(text()).toContain("這個頻道已經是大廳")
    expect(onSaved).not.toHaveBeenCalled()
  })

  it("Discord 拒絕時顯示原因", async () => {
    responses[`POST ${BASE}/lobbies`] = { status: 502, body: { error: "discord_error", message: "Missing Access" } }
    await mountForm()
    change(field("大廳頻道"), "50")
    change(field("私人頻道所在的分類"), "70")
    await submit()
    expect(text()).toContain("Discord 拒絕了這次操作：Missing Access")
  })

  it("部分私人頻道套用失敗時列出頻道，按關閉才離開", async () => {
    responses[`POST ${BASE}/lobbies`] = {
      status: 200,
      body: { channel_id: "50", message_id: "900", jump_url: "u", failures: [{ channel_id: "801", reason: "缺少權限" }] },
    }
    const { onSaved, onClose } = await mountForm()
    change(field("大廳頻道"), "50")
    change(field("私人頻道所在的分類"), "70")
    await submit()
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(text()).toContain("大廳設定已儲存")
    expect(text()).toContain("頻道 801")
    expect(text()).toContain("缺少權限")
    await click(buttonByText("關閉"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("TicketLobbyForm：修改", () => {
  const lobby = { channel: { id: "50" } }

  it("載入既有設定並預填", async () => {
    await mountForm({ lobby })
    expect((field("頻道名稱前綴") as HTMLInputElement).value).toBe("report")
    expect((field("私人頻道所在的分類") as HTMLSelectElement).value).toBe("70")
    expect(checkbox("客服人員").checked).toBe(true)
    expect(text()).toContain("大廳頻道還在時不能更換")
  })

  it("送出時帶上載入時的原值", async () => {
    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 200,
      body: { channel_id: "50", message_id: "900", jump_url: "u", failures: [] },
    }
    const { onSaved, onClose } = await mountForm({ lobby })
    change(field("頻道名稱前綴"), "support")
    await click(checkbox("管理組"))
    await submit()
    const put = calls.find((c) => c.method === "PUT")!
    expect(put.body).toMatchObject({
      lobby_channel: { kind: "existing", id: "50" },
      name_prefix: "support",
      manager_role_ids: ["1", "2"],
      original: ORIGINAL,
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("身分組已被刪除時仍列出，取消勾選即可移除", async () => {
    responses[`GET ${BASE}/lobbies/50`] = {
      status: 200,
      body: { ...DETAIL, manager_role_ids: ["1", "999"], original: { ...ORIGINAL, manager_role_ids: ["1", "999"] } },
    }
    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 200,
      body: { channel_id: "50", message_id: "900", jump_url: "u", failures: [] },
    }
    await mountForm({ lobby })
    expect(text()).toContain("999（身分組已被刪除")
    await click(checkbox("999"))
    await submit()
    expect(calls.find((c) => c.method === "PUT")!.body?.manager_role_ids).toEqual(["1"])
  })

  it("衝突時並排顯示最新版本，覆蓋時改用最新版本當原值", async () => {
    const latest = { ...DETAIL, name_prefix: "別人改的", original: { ...ORIGINAL, name_prefix: "別人改的" } }
    responses[`PUT ${BASE}/lobbies/50`] = { status: 409, body: { error: "conflict", deleted: false, current: latest } }
    const { onSaved } = await mountForm({ lobby })
    change(field("頻道名稱前綴"), "mine")
    await submit()
    expect(text()).toContain("已在你編輯期間被別人修改")
    expect(text()).toContain("別人改的")
    expect((field("頻道名稱前綴") as HTMLInputElement).value).toBe("mine")
    expect(onSaved).not.toHaveBeenCalled()

    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 200,
      body: { channel_id: "50", message_id: "900", jump_url: "u", failures: [] },
    }
    await click(buttonByText("以我的內容覆蓋"))
    const second = calls.filter((c) => c.method === "PUT")[1]
    expect((second.body?.original as { name_prefix: string }).name_prefix).toBe("別人改的")
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it("大廳已被移除時可以在原頻道重新新增", async () => {
    responses[`PUT ${BASE}/lobbies/50`] = { status: 409, body: { error: "conflict", deleted: true, current: null } }
    responses[`POST ${BASE}/lobbies`] = {
      status: 200,
      body: { channel_id: "50", message_id: "900", jump_url: "u", failures: [] },
    }
    const { onSaved } = await mountForm({ lobby })
    await submit()
    expect(text()).toContain("已在你編輯期間被刪除")
    await click(buttonByText("重新新增"))
    const post = calls.find((c) => c.method === "POST")!
    expect(post.body?.lobby_channel).toEqual({ kind: "existing", id: "50" })
    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it("大廳頻道已被刪除時必須重新選頻道，送出新頻道", async () => {
    responses[`GET ${BASE}/lobbies/50`] = {
      status: 200,
      body: { ...DETAIL, channel: { id: "50", name: null }, invalid_reason: "channel_deleted" },
    }
    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 200,
      body: { channel_id: "51", message_id: "900", jump_url: "u", failures: [] },
    }
    await mountForm({ lobby })
    expect(text()).toContain("原本的大廳頻道已被刪除")
    await submit()
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(0)
    expect(text()).toContain("請選擇大廳頻道")
    change(field("大廳頻道"), "51")
    await submit()
    expect(calls.find((c) => c.method === "PUT")!.body?.lobby_channel).toEqual({ kind: "existing", id: "51" })
  })

  it("分類已被刪除時要求重新選擇", async () => {
    responses[`GET ${BASE}/lobbies/50`] = {
      status: 200,
      body: { ...DETAIL, ticket_category_id: "999", invalid_reason: "category_deleted" },
    }
    await mountForm({ lobby })
    expect(text()).toContain("原本的分類已被刪除")
    await submit()
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(0)
    expect(text()).toContain("請選擇私人頻道所在的分類")
  })

  it("大廳訊息被刪除時說明會重新發出", async () => {
    responses[`GET ${BASE}/lobbies/50`] = { status: 200, body: { ...DETAIL, invalid_reason: "message_deleted" } }
    await mountForm({ lobby })
    expect(text()).toContain("大廳訊息已被刪除")
  })

  it("載入失敗時說明", async () => {
    responses[`GET ${BASE}/lobbies/50`] = { status: 500, body: { error: "x" } }
    await mountForm({ lobby })
    expect(text()).toContain("無法載入這個大廳")
  })

  it("編輯時顯示大廳頻道的 bot 權限警告", async () => {
    responses[`GET ${BASE}/options`] = {
      status: 200,
      body: {
        ...OPTIONS,
        channels: [
          {
            id: "50",
            name: "開單",
            category: "客服",
            permission_issues: [{ permission: "Embed Links", target: "lobby_channel", consequence: "大廳訊息的 embed 無法顯示" }],
          },
        ],
      },
    }
    await mountForm({ lobby })
    expect(text()).toContain("缺少 Embed Links")
  })

  it("修改時後端說大廳頻道不能用：顯示原因並改成要求重新選頻道", async () => {
    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 400,
      body: { error: "invalid_request", fields: [{ path: "lobby_channel", reason: "找不到這個文字頻道" }] },
    }
    await mountForm({ lobby })
    await submit()
    expect(text()).toContain("找不到這個文字頻道")
    expect(field("大廳頻道")).toBeTruthy() // 出現選頻道的欄位
    expect(text()).toContain("原本的大廳頻道已被刪除")
  })

  it("畫面上沒有對應欄位的錯誤改用提示顯示", async () => {
    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 400,
      body: { error: "invalid_request", fields: [{ path: "something_else", reason: "奇怪的錯誤" }] },
    }
    await mountForm({ lobby })
    await submit()
    expect(text()).toContain("奇怪的錯誤")
  })

  it("大廳頻道讀不到訊息（缺權限）時顯示要補的權限", async () => {
    responses[`PUT ${BASE}/lobbies/50`] = {
      status: 400,
      body: {
        error: "bot_missing_permission",
        fields: [{ path: "lobby_channel", reason: "我在大廳頻道缺少 View Channel 或 Read Message History 權限" }],
      },
    }
    await mountForm({ lobby })
    await submit()
    expect(text()).toContain("Read Message History")
  })

  it("從暫存還原時保留「大廳頻道已失效」的狀態", async () => {
    await mountForm({
      lobby,
      restored: {
        lobbyId: "50",
        original: ORIGINAL,
        channelKind: "existing",
        channelId: null,
        newName: "",
        newCategoryId: null,
        ticketCategoryId: "70",
        managerRoleIds: ["1"],
        namePrefix: "report",
        onePerUser: true,
        maxOpen: "",
        message: DETAIL.content,
        buttonLabel: "",
        buttonEmoji: null,
        channelInvalid: true,
        messageInvalid: true,
      },
    })
    expect(text()).toContain("原本的大廳頻道已被刪除")
    expect(text()).toContain("大廳訊息已被刪除")
    expect(field("大廳頻道")).toBeTruthy()
  })
})

const LISTED: TicketLobby = {
  channel: { id: "50", name: "開單", invalid: false },
  jump_url: "u",
  message_invalid: false,
  category: { id: "70", name: "客服區", invalid: false },
  invalid_reason: null,
  manager_roles: [],
  name_prefix: "report",
  one_per_user: true,
  max_open: null,
  ticket_count: 4,
  locked_count: 1,
  permission_issues: [],
  tickets: [],
}

describe("TicketLobbyRemoveButton", () => {
  async function mountRemove() {
    const onDone = vi.fn()
    await act(async () => {
      root.render(<TicketLobbyRemoveButton guildId="1" lobby={LISTED} onDone={onDone} />)
    })
    await click(buttonByText("移除"))
    return { onDone }
  }

  it("確認視窗說明後果，確認後帶原值移除並通知重新載入", async () => {
    responses[`DELETE ${BASE}/lobbies/50`] = { status: 200, body: { removed: true } }
    const { onDone } = await mountRemove()
    expect(text()).toContain("開單按鈕會拿掉")
    expect(text()).toContain("目前 4 個")
    expect(text()).toContain("未歸屬的私人頻道")
    await click(buttonByText("確認移除"))
    expect(calls.find((c) => c.method === "DELETE")!.body).toEqual({ original: ORIGINAL })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("衝突時不關閉，更新成最新版本請使用者再確認一次", async () => {
    const latest = { ...DETAIL, original: { ...ORIGINAL, name_prefix: "別人改的" } }
    responses[`DELETE ${BASE}/lobbies/50`] = { status: 409, body: { error: "conflict", deleted: false, current: latest } }
    const { onDone } = await mountRemove()
    await click(buttonByText("確認移除"))
    expect(onDone).not.toHaveBeenCalled()
    expect(text()).toContain("被別人修改過")
    responses[`DELETE ${BASE}/lobbies/50`] = { status: 200, body: { removed: true } }
    await click(buttonByText("確認移除"))
    const second = calls.filter((c) => c.method === "DELETE")[1]
    expect((second.body?.original as { name_prefix: string }).name_prefix).toBe("別人改的")
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("已被別人移除視為完成", async () => {
    responses[`DELETE ${BASE}/lobbies/50`] = { status: 409, body: { error: "conflict", deleted: true, current: null } }
    const { onDone } = await mountRemove()
    await click(buttonByText("確認移除"))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("按鈕沒拿掉（bot 缺權限）時大廳仍已移除，視窗說明後續，按關閉才離開", async () => {
    responses[`DELETE ${BASE}/lobbies/50`] = { status: 200, body: { removed: true, button_removed: false } }
    const { onDone } = await mountRemove()
    await click(buttonByText("確認移除"))
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(text()).toContain("開單按鈕還留在訊息上")
    expect(text()).toContain("Read Message History")
    expect(buttonByText("確認移除")).toBeUndefined()
    await click(buttonByText("關閉"))
    expect(container.querySelector("dialog")?.hasAttribute("open")).toBe(false)
  })

  it("Discord 拒絕時顯示原因，大廳沒有移除", async () => {
    responses[`DELETE ${BASE}/lobbies/50`] = { status: 502, body: { error: "discord_error", message: "Missing Access" } }
    const { onDone } = await mountRemove()
    await click(buttonByText("確認移除"))
    expect(text()).toContain("Missing Access")
    expect(text()).toContain("大廳沒有移除")
    expect(onDone).not.toHaveBeenCalled()
  })
})
