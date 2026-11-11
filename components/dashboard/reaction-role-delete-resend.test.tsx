import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ReactionRoleDeleteButton } from "./reaction-role-delete-button"
import { ReactionRoleResendButton } from "./reaction-role-resend-button"
import type { ReactionRoleDetail, ReactionRoleMessage, ReactionRoleOptions } from "@/lib/dashboard-reaction-roles"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const OPTIONS: ReactionRoleOptions = {
  channels: [
    { id: "50", name: "身分組", category: "資訊", permission_issues: [] },
    { id: "51", name: "公告", category: "資訊", permission_issues: [] },
  ],
  roles: [],
  emojis: [],
}

const detailButton = (role_id: string, title: string, invalid = false, emojiInvalid = false) => ({
  role_id,
  role: { id: role_id, name: invalid ? null : `身分組${role_id}`, invalid },
  title,
  emoji: null,
  emoji_invalid: emojiInvalid,
  style: 1,
  locked: false,
  locked_reason: null,
})

const DETAIL: ReactionRoleDetail = {
  message_id: "900",
  channel: { id: "50", name: "身分組", invalid: false },
  content: { content: "請選身分組", embed: null },
  content_json: '{"content":"請選身分組"}',
  content_locked: null,
  buttons: [detailButton("1", "活動"), detailButton("2", "已刪除的", true), detailButton("3", "表情失效", false, true)],
}

const message = (over: Partial<ReactionRoleMessage> = {}): ReactionRoleMessage => ({
  message_id: "900",
  channel: { id: "50", name: "身分組", invalid: false },
  invalid: false,
  summary: "請選身分組",
  jump_url: "https://discord.com/channels/1/50/900",
  buttons: [],
  permission_issues: [],
  ...over,
})

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
      const res = responses[`${method} ${url.replace(/^.*\/dashboard/, "/dashboard")}`] ?? { status: 404, body: { error: "not_found" } }
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

const BASE = "/dashboard/guilds/1/reaction-roles"
const text = () => container.textContent ?? ""
const buttonByText = (t: string) => [...container.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(t)) as HTMLButtonElement
const click = async (el: Element) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
  await flush()
}

function change(el: Element, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }))
  })
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
    [`GET ${BASE}/900`]: { status: 200, body: DETAIL },
    [`GET ${BASE}/options`]: { status: 200, body: OPTIONS },
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

async function mountDelete(m = message()) {
  const onDone = vi.fn()
  await act(async () => {
    root.render(<ReactionRoleDeleteButton guildId="1" message={m} onDone={onDone} />)
  })
  await click(buttonByText(m.invalid || m.channel.invalid ? "移除紀錄" : "刪除"))
  return { onDone }
}

describe("ReactionRoleDeleteButton", () => {
  it("確認視窗有兩個選項，預設是刪除訊息", async () => {
    await mountDelete()
    const radios = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
    expect(radios.map((r) => r.value)).toEqual(["delete_message", "remove_buttons"])
    expect(radios[0].checked).toBe(true)
    expect(radios[1].checked).toBe(false)
    expect(text()).toContain("刪除訊息")
    expect(text()).toContain("只拿掉按鈕、保留訊息")
  })

  it("預設送出 delete_message，附上開啟時載入的原值，成功後通知重新載入", async () => {
    responses[`DELETE ${BASE}/900`] = { status: 200, body: { deleted: true } }
    const { onDone } = await mountDelete()
    await click(buttonByText("確認刪除"))
    const call = calls.find((c) => c.method === "DELETE")!
    expect(call.body?.mode).toBe("delete_message")
    expect(call.body?.original).toEqual({
      content_json: DETAIL.content_json,
      buttons: DETAIL.buttons.map((b) => ({ role_id: b.role_id, title: b.title, emoji: b.emoji, style: b.style })),
    })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("選「只拿掉按鈕」送出 remove_buttons", async () => {
    responses[`DELETE ${BASE}/900`] = { status: 200, body: { deleted: true } }
    await mountDelete()
    const radio = container.querySelector<HTMLInputElement>('input[value="remove_buttons"]')!
    await click(radio)
    await click(buttonByText("確認刪除"))
    expect(calls.find((c) => c.method === "DELETE")!.body?.mode).toBe("remove_buttons")
  })

  it("訊息已失效時只提供移除紀錄，沒有刪除方式選項", async () => {
    responses[`DELETE ${BASE}/900`] = { status: 200, body: { deleted: true } }
    const { onDone } = await mountDelete(message({ invalid: true }))
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0)
    expect(text()).toContain("在 Discord 上已不存在")
    await click(buttonByText("確認移除"))
    expect(calls.find((c) => c.method === "DELETE")!.body?.mode).toBe("delete_message")
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("衝突時不關閉，更新成最新版本並請使用者再確認一次", async () => {
    const latest = { ...DETAIL, content_json: '{"content":"別人改的"}', buttons: [detailButton("1", "別人改的")] }
    responses[`DELETE ${BASE}/900`] = { status: 409, body: { error: "conflict", deleted: false, current: latest } }
    const { onDone } = await mountDelete()
    await click(buttonByText("確認刪除"))
    expect(onDone).not.toHaveBeenCalled()
    expect(text()).toContain("被別人修改過")
    // 再按一次時用最新版本當原值
    responses[`DELETE ${BASE}/900`] = { status: 200, body: { deleted: true } }
    await click(buttonByText("確認刪除"))
    const second = calls.filter((c) => c.method === "DELETE")[1]
    expect((second.body?.original as { content_json: string }).content_json).toBe('{"content":"別人改的"}')
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("紀錄已被別人刪除（衝突且 deleted）視為完成", async () => {
    responses[`DELETE ${BASE}/900`] = { status: 409, body: { error: "conflict", deleted: true, current: null } }
    const { onDone } = await mountDelete()
    await click(buttonByText("確認刪除"))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("Discord 拒絕時顯示原因，紀錄沒有移除，視窗保持開啟", async () => {
    responses[`DELETE ${BASE}/900`] = { status: 502, body: { error: "discord_error", message: "Missing Permissions" } }
    const { onDone } = await mountDelete()
    await click(buttonByText("確認刪除"))
    expect(text()).toContain("Missing Permissions")
    expect(text()).toContain("紀錄沒有移除")
    expect(onDone).not.toHaveBeenCalled()
  })

  it("載入原值失敗時不能確認", async () => {
    responses[`GET ${BASE}/900`] = { status: 500, body: { error: "oops" } }
    await mountDelete()
    expect(text()).toContain("無法載入這則的目前內容")
    expect(buttonByText("確認刪除").disabled).toBe(true)
  })
})

async function mountResend(m = message({ invalid: true })) {
  const onDone = vi.fn()
  await act(async () => {
    root.render(<ReactionRoleResendButton guildId="1" message={m} onDone={onDone} />)
  })
  await click(buttonByText("重新發送"))
  return { onDone }
}

const channelSelect = () => container.querySelector("select") as HTMLSelectElement
const sendButton = () => [...container.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "重新發送").at(-1)!

describe("ReactionRoleResendButton", () => {
  it("頻道預設是原頻道，並列出會被略過的失效按鈕", async () => {
    await mountResend()
    expect(channelSelect().value).toBe("50")
    expect(text()).toContain("會使用最後記錄的訊息內容")
    expect(text()).toContain("重新發送時會略過")
    expect(text()).toContain("已刪除的")
    expect(text()).toContain("表情失效")
    expect(container.querySelector("textarea")).toBeNull()
  })

  it("發送到另一個頻道，只送頻道，成功後告知略過的按鈕", async () => {
    responses[`POST ${BASE}/900/resend`] = {
      status: 200,
      body: {
        message_id: "901",
        channel_id: "51",
        jump_url: "https://discord.com/channels/1/51/901",
        skipped: [
          { role_id: "2", role_name: null, title: "已刪除的", reason: "身分組不存在" },
          { role_id: "3", role_name: "身分組3", title: "表情失效", reason: "自訂 emoji 已不存在" },
        ],
      },
    }
    const { onDone } = await mountResend()
    change(channelSelect(), "51")
    await click(sendButton())
    const call = calls.find((c) => c.method === "POST")!
    expect(call.body).toEqual({ channel_id: "51", message: null })
    expect(text()).toContain("已重新發送")
    expect(text()).toContain("已刪除的：身分組不存在")
    expect(text()).toContain("表情失效：自訂 emoji 已不存在")
    expect(onDone).not.toHaveBeenCalled()
    await click(buttonByText("完成"))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("原頻道已被刪除時必須重新選頻道，沒選不送出", async () => {
    responses[`POST ${BASE}/900/resend`] = {
      status: 200,
      body: { message_id: "901", channel_id: "51", jump_url: "u", skipped: [] },
    }
    await mountResend(message({ invalid: true, channel: { id: "49", name: null, invalid: true } }))
    expect(channelSelect().value).toBe("")
    expect(text()).toContain("原頻道已被刪除，請重新選擇頻道")
    await click(sendButton())
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0)
    expect(text()).toContain("請選擇要發送的頻道")
    change(channelSelect(), "51")
    await click(sendButton())
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1)
  })

  it("沒有存下的內容時顯示「沒有可重新發送的內容」並開編輯器，內容空白不送出", async () => {
    responses[`GET ${BASE}/900`] = {
      status: 200,
      body: { ...DETAIL, content: null, content_json: null, content_locked: "message_unavailable" },
    }
    await mountResend()
    expect(text()).toContain("沒有可重新發送的內容")
    expect(container.querySelector("textarea")).not.toBeNull()
    await click(sendButton())
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0)
    expect(text()).toContain("文字與 embed 至少要填一項")
  })

  it("重新編排內容後一併送出", async () => {
    responses[`GET ${BASE}/900`] = {
      status: 200,
      body: { ...DETAIL, content: null, content_json: null, content_locked: "message_unavailable" },
    }
    responses[`POST ${BASE}/900/resend`] = {
      status: 200,
      body: { message_id: "901", channel_id: "50", jump_url: "u", skipped: [] },
    }
    await mountResend()
    change(container.querySelector("textarea")!, "重新編排的內容")
    await click(sendButton())
    const call = calls.find((c) => c.method === "POST")!
    expect(call.body?.channel_id).toBe("50")
    expect((call.body?.message as { content: string }).content).toBe("重新編排的內容")
  })

  it("多 embed 或附件的訊息失效後必須重新編排，並說明原因", async () => {
    responses[`GET ${BASE}/900`] = {
      status: 200,
      body: { ...DETAIL, content: null, content_json: null, content_locked: "multiple_embeds" },
    }
    await mountResend()
    expect(text()).toContain("需要重新編排")
    expect(text()).toContain("兩個以上的 embed")
    expect(container.querySelector("textarea")).not.toBeNull()
  })

  it("全部按鈕都失效時顯示後端的拒絕原因", async () => {
    responses[`POST ${BASE}/900/resend`] = {
      status: 400,
      body: { error: "no_valid_buttons", skipped: [{ role_id: "2", role_name: null, title: "x", reason: "r" }] },
    }
    const { onDone } = await mountResend()
    await click(sendButton())
    expect(text()).toContain("全都失效")
    expect(onDone).not.toHaveBeenCalled()
  })

  it("後端指出頻道有問題時顯示在視窗內", async () => {
    responses[`POST ${BASE}/900/resend`] = {
      status: 400,
      body: { error: "invalid_request", fields: [{ path: "channel_id", reason: "找不到這個文字頻道，請重新選擇" }] },
    }
    await mountResend()
    await click(sendButton())
    expect(text()).toContain("找不到這個文字頻道")
  })

  it("載入失敗時不能發送", async () => {
    responses[`GET ${BASE}/900`] = { status: 500, body: { error: "oops" } }
    await mountResend()
    expect(text()).toContain("無法載入這則的內容與頻道選項")
    expect(sendButton().disabled).toBe(true)
  })
})
