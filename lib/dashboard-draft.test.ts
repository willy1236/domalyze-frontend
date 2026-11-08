import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DRAFT_PREFIX, redirectToLogin, setDashboardHooks, setDashboardUserId } from "./dashboard-api"
import { consumeDraft, createDraftHooks, registerDraft } from "./dashboard-draft"

let unregister: Array<() => void> = []

function register(entryKey: string, mode: "create" | "edit", state: unknown) {
  unregister.push(registerDraft(entryKey, mode, () => state))
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  unregister.forEach((fn) => fn())
  unregister = []
  setDashboardHooks({})
  setDashboardUserId(null)
  vi.restoreAllMocks()
})

describe("表單暫存", () => {
  it("導向登入前存下已註冊的表單，同一個帳號回來時取得並刪除", async () => {
    const hooks = createDraftHooks("u1")
    register("channel:1", "edit", { channel: "5", message: "hi" })
    register("community:new", "create", { step: 2 })

    hooks.beforeLoginRedirect?.()

    expect(consumeDraft("channel:1")).toEqual({ mode: "edit", state: { channel: "5", message: "hi" } })
    expect(consumeDraft("community:new")).toEqual({ mode: "create", state: { step: 2 } })
    // 取出後即刪除
    expect(consumeDraft("channel:1")).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it("wrapper 的 redirectToLogin 會先存下暫存", () => {
    setDashboardHooks(createDraftHooks("u1"))
    setDashboardUserId("u1")
    register("channel:1", "edit", { a: 1 })
    // jsdom 不支援導向，會對 console.error 報 not implemented
    vi.spyOn(console, "error").mockImplementation(() => {})

    void redirectToLogin()

    expect(consumeDraft("channel:1")).toEqual({ mode: "edit", state: { a: 1 } })
  })

  it("不同帳號回來時取不到", () => {
    createDraftHooks("u1").beforeLoginRedirect?.()
    register("channel:1", "edit", { a: 1 })
    createDraftHooks("u1").beforeLoginRedirect?.()

    createDraftHooks("u2")
    expect(consumeDraft("channel:1")).toBeNull()
    // 不同帳號時也一併清掉，不會留給之後的帳號
    expect(sessionStorage.length).toBe(0)
  })

  it("收到 no_permission 時暫存被清掉", () => {
    const hooks = createDraftHooks("u1")
    register("channel:1", "edit", { a: 1 })
    hooks.beforeLoginRedirect?.()
    expect(sessionStorage.length).toBe(1)

    hooks.onNoPermission?.()

    expect(consumeDraft("channel:1")).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it("取消註冊的表單不會被存下", () => {
    const hooks = createDraftHooks("u1")
    const off = registerDraft("channel:1", "edit", () => ({ a: 1 }))
    off()

    hooks.beforeLoginRedirect?.()

    expect(consumeDraft("channel:1")).toBeNull()
  })

  it("重新註冊同一筆後，舊的取消註冊不影響新的", () => {
    const hooks = createDraftHooks("u1")
    const offOld = registerDraft("channel:1", "edit", () => ({ v: "old" }))
    register("channel:1", "edit", { v: "new" })
    offOld()

    hooks.beforeLoginRedirect?.()

    expect(consumeDraft("channel:1")?.state).toEqual({ v: "new" })
  })

  it("getState 拋錯不影響其他表單", () => {
    const hooks = createDraftHooks("u1")
    unregister.push(
      registerDraft("bad", "edit", () => {
        throw new Error("boom")
      }),
    )
    register("good", "edit", { ok: true })

    hooks.beforeLoginRedirect?.()

    expect(consumeDraft("bad")).toBeNull()
    expect(consumeDraft("good")?.state).toEqual({ ok: true })
  })

  it("內容損壞時回 null", () => {
    createDraftHooks("u1")
    sessionStorage.setItem(`${DRAFT_PREFIX}:channel:1`, "not json")
    expect(consumeDraft("channel:1")).toBeNull()
  })
})
