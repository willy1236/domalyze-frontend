import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ReactionRoleForm } from "./reaction-role-form"
import type { ReactionRoleDetail, ReactionRoleMessage, ReactionRoleOptions } from "@/lib/dashboard-reaction-roles"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const OPTIONS: ReactionRoleOptions = {
  channels: [{ id: "50", name: "身分組", category: "資訊", permission_issues: [] }],
  roles: [
    { id: "1", name: "活動", color: 0, disabled_reason: null, dangerous: false, dangerous_permissions: [] },
    { id: "2", name: "遊戲", color: 0, disabled_reason: null, dangerous: false, dangerous_permissions: [] },
    { id: "3", name: "管理組", color: 0, disabled_reason: null, dangerous: true, dangerous_permissions: ["administrator", "manage_roles"] },
    { id: "4", name: "幹部", color: 0, disabled_reason: "只能設定低於你最高身分組的身分組", dangerous: false, dangerous_permissions: [] },
    { id: "5", name: "機器人", color: 0, disabled_reason: "此身分組不低於我的最高身分組，我無法發放", dangerous: false, dangerous_permissions: [] },
  ],
  emojis: [{ id: "700", name: "ok", animated: false, value: "<:ok:700>" }],
}

const DETAIL: ReactionRoleDetail = {
  message_id: "900",
  channel: { id: "50", name: "身分組", invalid: false },
  content: { content: "請選身分組", embed: null },
  content_json: '{"content":"請選身分組"}',
  content_locked: null,
  buttons: [
    { role_id: "1", role: { id: "1", name: "活動", invalid: false }, title: "活動通知", emoji: "🎉", emoji_invalid: false, style: 1, locked: false, locked_reason: null },
    { role_id: "4", role: { id: "4", name: "幹部", invalid: false }, title: "幹部專用", emoji: null, emoji_invalid: false, style: 2, locked: true, locked_reason: "x" },
  ],
}

const LISTED: ReactionRoleMessage = {
  message_id: "900",
  channel: { id: "50", name: "身分組", invalid: false },
  invalid: false,
  summary: "請選身分組",
  jump_url: "https://discord.com/channels/1/50/900",
  buttons: [],
  permission_issues: [],
}

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
      calls.push({ method, path: url, body })
      const key = `${method} ${url}`
      const found = method !== "GET" && responses[method] ? ([method, responses[method]] as const) : Object.entries(responses).find(([k]) => key.endsWith(k))
      const res = found?.[1] ?? { status: 404, body: { error: "not_found" } }
      return { ok: res.status < 400, status: res.status, json: async () => res.body } as Response
    }),
  )
}

async function flush() {
  for (let i = 0; i < 5; i++) await act(async () => { await Promise.resolve() })
}

async function mount(props: Partial<React.ComponentProps<typeof ReactionRoleForm>> = {}) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  await act(async () => {
    root.render(<ReactionRoleForm guildId="1" message={null} onClose={onClose} onSaved={onSaved} {...props} />)
  })
  await flush()
  return { onClose, onSaved }
}

function change(el: Element, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }))
  })
}

const button = (text: string) => [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === text) as HTMLButtonElement
const select = (label: string, nth = 0) =>
  [...container.querySelectorAll("label")].filter((l) => l.textContent?.startsWith(label)).map((l) => document.getElementById(l.htmlFor) as HTMLSelectElement)[nth]
const input = (label: string, nth = 0) =>
  [...container.querySelectorAll("label")].filter((l) => l.textContent?.startsWith(label)).map((l) => document.getElementById(l.htmlFor) as HTMLInputElement)[nth]
const contentBox = () => container.querySelector("textarea") as HTMLTextAreaElement
const text = () => container.textContent ?? ""
const submit = async () => {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  })
  await flush()
}

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  responses = {
    "/reaction-roles/options": { status: 200, body: OPTIONS },
    "/reaction-roles/900": { status: 200, body: DETAIL },
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

describe("ReactionRoleForm：發新訊息", () => {
  it("沒選頻道、沒有內容、按鈕沒選身分組時不送出，並指出原因", async () => {
    const { onSaved } = await mount()
    await submit()
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0)
    expect(text()).toContain("請選擇要發送的頻道")
    expect(text()).toContain("文字與 embed 至少要填一項")
    expect(text()).toContain("請選擇身分組")
    expect(onSaved).not.toHaveBeenCalled()
  })

  it("選頻道、填內容、設兩顆按鈕後送出正確的內容", async () => {
    responses["POST"] = { status: 200, body: { message_id: "901", jump_url: "u" } }
    const { onSaved, onClose } = await mount()
    change(select("發送到哪個頻道"), "50")
    change(contentBox(), "歡迎")
    change(select("身分組", 0), "1")
    change(input("標題（最多 80 字）", 0), " 活動 ")
    change(select("Emoji", 0), "🎉")
    act(() => button("新增按鈕").click())
    change(select("身分組", 1), "2")
    change(input("標題（最多 80 字）", 1), "遊戲")
    change(select("樣式", 1), "3")
    await submit()
    const post = calls.find((c) => c.method === "POST")!
    expect(post.body).toEqual({
      target: { kind: "new", channel_id: "50" },
      message: { content: "歡迎", embed: null },
      buttons: [
        { role_id: "1", title: "活動", emoji: "🎉", style: 1 },
        { role_id: "2", title: "遊戲", emoji: null, style: 3 },
      ],
    })
    expect(onSaved).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("身分組選單停用不可選的身分組並說明原因，已被其他按鈕選走的也停用", async () => {
    await mount()
    act(() => button("新增按鈕").click())
    change(select("身分組", 0), "1")
    const options = [...select("身分組", 1).options]
    const byName = (name: string) => options.find((o) => o.textContent?.startsWith(name))!
    expect(byName("幹部").disabled).toBe(true)
    expect(byName("幹部").textContent).toContain("只能設定低於你最高身分組的身分組")
    expect(byName("機器人").disabled).toBe(true)
    expect(byName("機器人").textContent).toContain("我無法發放")
    expect(byName("活動").disabled).toBe(true)
    expect(byName("活動").textContent).toContain("已用於這則訊息的其他按鈕")
    expect(byName("遊戲").disabled).toBe(false)
  })

  it("選了帶危險權限的身分組會顯示警告，但仍可送出", async () => {
    responses["POST"] = { status: 200, body: { message_id: "901", jump_url: "u" } }
    await mount()
    change(select("發送到哪個頻道"), "50")
    change(contentBox(), "x")
    change(select("身分組", 0), "3")
    change(input("標題（最多 80 字）", 0), "管理")
    expect(text()).toContain("任何人按下按鈕都會取得這些權限：Administrator、Manage Roles")
    await submit()
    expect(calls.some((c) => c.method === "POST")).toBe(true)
  })

  it("按鈕最多 25 顆，達到上限後不能再新增；可以刪除與調整順序", async () => {
    await mount()
    for (let i = 0; i < 24; i++) act(() => button("新增按鈕").click())
    expect(text()).toContain("按鈕（25／25）")
    expect(button("新增按鈕").disabled).toBe(true)
    change(input("標題（最多 80 字）", 0), "第一")
    change(input("標題（最多 80 字）", 1), "第二")
    act(() => (container.querySelector('[aria-label="第 1 顆按鈕下移"]') as HTMLButtonElement).click())
    expect(input("標題（最多 80 字）", 0).value).toBe("第二")
    expect(input("標題（最多 80 字）", 1).value).toBe("第一")
    act(() => (container.querySelector('[aria-label="刪除第 1 顆按鈕"]') as HTMLButtonElement).click())
    expect(text()).toContain("按鈕（24／25）")
    expect(input("標題（最多 80 字）", 0).value).toBe("第一")
  })

  it("後端回報按鈕欄位錯誤時顯示在對應的按鈕，輸入內容保留", async () => {
    responses["POST"] = {
      status: 400,
      body: { error: "invalid_request", fields: [{ path: "buttons.0.role_id", reason: "此身分組不低於我的最高身分組，我無法發放" }] },
    }
    await mount()
    change(select("發送到哪個頻道"), "50")
    change(contentBox(), "保留我")
    change(select("身分組", 0), "1")
    change(input("標題（最多 80 字）", 0), "活動")
    await submit()
    expect(text()).toContain("我無法發放")
    expect(contentBox().value).toBe("保留我")
    expect(input("標題（最多 80 字）", 0).value).toBe("活動")
  })
})

describe("ReactionRoleForm：編輯", () => {
  it("帶入內容與按鈕；位階不低於操作者的按鈕停用並只能刪除", async () => {
    await mount({ message: LISTED })
    expect(contentBox().value).toBe("請選身分組")
    expect(input("標題（最多 80 字）", 0).value).toBe("活動通知")
    expect(input("標題（最多 80 字）", 1).disabled).toBe(true)
    expect(select("身分組", 1).disabled).toBe(true)
    expect(text()).toContain("只能刪除，不能修改")
    expect((container.querySelector('[aria-label="刪除第 2 顆按鈕"]') as HTMLButtonElement).disabled).toBe(false)
    expect(container.querySelector("#rr-channel")).toBeNull()
  })

  it("存檔送出 original 快照與目前的內容", async () => {
    responses["PUT"] = { status: 200, body: DETAIL }
    const { onSaved } = await mount({ message: LISTED })
    change(input("標題（最多 80 字）", 0), "活動通知二")
    await submit()
    const put = calls.find((c) => c.method === "PUT")!
    expect(put.path).toContain("/reaction-roles/900")
    expect(put.body).toEqual({
      message: { content: "請選身分組", embed: null },
      buttons: [
        { role_id: "1", title: "活動通知二", emoji: "🎉", style: 1 },
        { role_id: "4", title: "幹部專用", emoji: null, style: 2 },
      ],
      original: {
        content_json: '{"content":"請選身分組"}',
        buttons: [
          { role_id: "1", title: "活動通知", emoji: "🎉", style: 1 },
          { role_id: "4", title: "幹部專用", emoji: null, style: 2 },
        ],
      },
    })
    expect(onSaved).toHaveBeenCalled()
  })

  it("內容不能改（多個 embed 等）時隱藏編輯器、只管按鈕，送出 message 為 null", async () => {
    responses["/reaction-roles/900"] = { status: 200, body: { ...DETAIL, content: null, content_locked: "multiple_embeds" } }
    responses["PUT"] = { status: 200, body: DETAIL }
    await mount({ message: LISTED })
    expect(container.querySelector("textarea")).toBeNull()
    expect(text()).toContain("只能管理按鈕")
    expect(text()).toContain("兩個以上的 embed")
    change(input("標題（最多 80 字）", 0), "改")
    await submit()
    expect(calls.find((c) => c.method === "PUT")!.body!.message).toBeNull()
  })

  it("衝突：顯示最新版本與我的輸入，輸入保留；以我的內容覆蓋時用最新版本當 original", async () => {
    const latest: ReactionRoleDetail = {
      ...DETAIL,
      content: { content: "別人改的", embed: null },
      content_json: '{"content":"別人改的"}',
    }
    responses["PUT"] = { status: 409, body: { error: "conflict", deleted: false, current: latest } }
    await mount({ message: LISTED })
    change(contentBox(), "我改的")
    await submit()
    expect(text()).toContain("已在你編輯期間被別人修改")
    expect(text()).toContain("別人改的")
    expect(contentBox().value).toBe("我改的")

    responses["PUT"] = { status: 200, body: latest }
    await act(async () => {
      button("以我的內容覆蓋").click()
    })
    await flush()
    const puts = calls.filter((c) => c.method === "PUT")
    expect(puts).toHaveLength(2)
    expect((puts[1].body!.original as { content_json: string }).content_json).toBe('{"content":"別人改的"}')
    expect(puts[1].body!.message).toEqual({ content: "我改的", embed: null })
  })

  it("紀錄已被刪除：提示並可重新新增", async () => {
    responses["PUT"] = { status: 409, body: { error: "conflict", deleted: true, current: null } }
    await mount({ message: LISTED })
    await submit()
    expect(text()).toContain("已在你編輯期間被刪除")
    expect(button("重新新增")).toBeTruthy()
  })

  it("DB 失敗時說明 Discord 已改回原樣", async () => {
    responses["PUT"] = { status: 500, body: { error: "save_failed" } }
    await mount({ message: LISTED })
    await submit()
    expect(text()).toContain("已改回原樣")
  })

  it("從暫存還原：不重新載入，帶回使用者輸入", async () => {
    await mount({
      message: null,
      restored: {
        messageId: "900",
        channelId: "50",
        original: { content_json: "j", buttons: [] },
        message: { content: "暫存內容", embed: null },
        contentLocked: null,
        buttons: [{ key: "k1", role_id: "1", title: "暫存按鈕", emoji: null, style: 1, locked: false }],
      },
    })
    expect(contentBox().value).toBe("暫存內容")
    expect(input("標題（最多 80 字）", 0).value).toBe("暫存按鈕")
    expect(calls.some((c) => c.path.endsWith("/reaction-roles/900"))).toBe(false)
  })
})

describe("ReactionRoleForm：掛到既有訊息", () => {
  const FREE = { message_id: "700", summary: "歡迎來到伺服器", created_at: "2026-11-11T01:00:00+00:00", status: "free" as const }
  const REGISTERED = { message_id: "701", summary: "已掛的身分組", created_at: "2026-11-11T02:00:00+00:00", status: "reaction_role" as const }
  const resolveKey = (id: string) => `/reaction-roles/resolve?link=${encodeURIComponent(`https://discord.com/channels/1/50/${id}`)}`
  const RESOLVED_FREE = {
    status: "free",
    message_id: "700",
    channel: { id: "50", name: "身分組" },
    jump_url: "https://discord.com/channels/1/50/700",
    summary: "歡迎來到伺服器",
    content: { content: "歡迎來到伺服器", embed: null },
    content_locked: null,
  }

  const radio = (value: string) => container.querySelector(`input[name="rr-source"][value="${value}"]`) as HTMLInputElement
  const candidate = (summary: string) =>
    [...container.querySelectorAll('ul[aria-label="可掛的訊息"] button')].find((b) => b.textContent?.includes(summary)) as HTMLButtonElement

  async function openPicker(props: Partial<React.ComponentProps<typeof ReactionRoleForm>> = {}) {
    responses["/reaction-roles/candidates?channel_id=50"] = { status: 200, body: { messages: [FREE, REGISTERED] } }
    const handlers = await mount(props)
    act(() => radio("existing").click())
    change(select("訊息所在的頻道"), "50")
    await flush()
    return handlers
  }

  async function pick(summary: string) {
    await act(async () => candidate(summary).click())
    await flush()
  }

  it("第一步可選發新訊息或掛到既有訊息；選既有訊息前不顯示內容與按鈕", async () => {
    await mount()
    expect(radio("new").checked).toBe(true)
    expect(contentBox()).toBeTruthy()
    act(() => radio("existing").click())
    expect(text()).toContain("把反應身分組掛到既有訊息")
    expect(text()).toContain("先選擇訊息所在的頻道")
    expect(contentBox()).toBeFalsy()
    expect(button("新增按鈕")).toBeFalsy()
  })

  it("選頻道後列出候選訊息，已是反應身分組的有標示", async () => {
    await openPicker()
    expect(calls.some((c) => c.path.endsWith("/reaction-roles/candidates?channel_id=50"))).toBe(true)
    expect(candidate("歡迎來到伺服器")).toBeTruthy()
    expect(candidate("已掛的身分組").textContent).toContain("已是反應身分組，點選後進入編輯")
    expect(candidate("歡迎來到伺服器").textContent).not.toContain("已是反應身分組")
  })

  it("點選候選訊息後帶入原內容，加按鈕送出 target.kind=existing", async () => {
    responses[resolveKey("700")] = { status: 200, body: RESOLVED_FREE }
    responses["POST"] = { status: 200, body: { message_id: "700", jump_url: "u" } }
    const { onSaved } = await openPicker()
    await pick("歡迎來到伺服器")
    expect(contentBox().value).toBe("歡迎來到伺服器")
    expect(text()).toContain("已選擇：歡迎來到伺服器")
    change(select("身分組", 0), "1")
    change(input("標題（最多 80 字）", 0), "活動")
    await submit()
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({
      target: { kind: "existing", channel_id: "50", message_id: "700" },
      message: { content: "歡迎來到伺服器", embed: null },
      buttons: [{ role_id: "1", title: "活動", emoji: null, style: 1 }],
    })
    expect(onSaved).toHaveBeenCalled()
  })

  it("貼上訊息連結解析並帶入內容", async () => {
    responses[resolveKey("700")] = { status: 200, body: RESOLVED_FREE }
    await mount()
    act(() => radio("existing").click())
    change(input("或貼上訊息連結"), "https://discord.com/channels/1/50/700")
    await act(async () => button("使用這則訊息").click())
    await flush()
    expect(contentBox().value).toBe("歡迎來到伺服器")
    expect(select("訊息所在的頻道").value).toBe("50")
  })

  it.each([
    ["wrong_guild", "這則訊息不屬於這個伺服器"],
    ["not_bot_message", "只能掛在星羽發的訊息上"],
    ["has_components", "已經帶有其他按鈕或互動元件"],
    ["invalid_link", "這不是 Discord 訊息連結"],
  ])("連結被擋下時顯示原因：%s", async (code, expected) => {
    responses[resolveKey("700")] = { status: 400, body: { error: code, message: "x" } }
    await mount()
    act(() => radio("existing").click())
    change(input("或貼上訊息連結"), "https://discord.com/channels/1/50/700")
    await act(async () => button("使用這則訊息").click())
    await flush()
    expect(text()).toContain(expected)
    expect(contentBox()).toBeFalsy()
  })

  it("兩則 embed 的訊息只能管按鈕：內容區停用並說明原因，送出的 message 為 null", async () => {
    responses[resolveKey("700")] = {
      status: 200,
      body: { ...RESOLVED_FREE, content: null, content_locked: "multiple_embeds" },
    }
    responses["POST"] = { status: 200, body: { message_id: "700", jump_url: "u" } }
    await openPicker()
    await pick("歡迎來到伺服器")
    expect(contentBox()).toBeFalsy()
    expect(text()).toContain("內容不能在這裡修改，只能管理按鈕")
    change(select("身分組", 0), "1")
    change(input("標題（最多 80 字）", 0), "活動")
    await submit()
    expect(calls.find((c) => c.method === "POST")!.body).toMatchObject({
      target: { kind: "existing", channel_id: "50", message_id: "700" },
      message: null,
    })
  })

  it("點選已是反應身分組的訊息，轉到它的編輯畫面", async () => {
    responses[resolveKey("701")] = {
      status: 200,
      body: { status: "reaction_role", message_id: "701", channel: { id: "50", name: "身分組" }, jump_url: "u", summary: "已掛的身分組" },
    }
    const onOpenExisting = vi.fn()
    await openPicker({ onOpenExisting })
    await pick("已掛的身分組")
    expect(onOpenExisting).toHaveBeenCalledWith("701")
  })

  it("沒選訊息就送出會提示，不送出請求", async () => {
    await openPicker()
    await submit()
    expect(text()).toContain("請先選擇要掛的訊息")
    expect(calls.some((c) => c.method === "POST")).toBe(false)
  })

  it("送出時才發現已是反應身分組，轉到編輯", async () => {
    responses[resolveKey("700")] = { status: 200, body: RESOLVED_FREE }
    responses["POST"] = { status: 400, body: { error: "already_reaction_role", message_id: "700" } }
    const onOpenExisting = vi.fn()
    await openPicker({ onOpenExisting })
    await pick("歡迎來到伺服器")
    change(select("身分組", 0), "1")
    change(input("標題（最多 80 字）", 0), "活動")
    await submit()
    expect(onOpenExisting).toHaveBeenCalledWith("700")
  })

  it("候選清單是空的時說明並建議貼連結", async () => {
    responses["/reaction-roles/candidates?channel_id=50"] = { status: 200, body: { messages: [] } }
    await mount()
    act(() => radio("existing").click())
    change(select("訊息所在的頻道"), "50")
    await flush()
    expect(text()).toContain("沒有可以掛的星羽訊息")
  })
})
