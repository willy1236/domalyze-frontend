import { afterEach, describe, expect, it, vi } from "vitest"
import { loadMe } from "./header-account"

function respond(response: Response | Error) {
  vi.stubGlobal("fetch", vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response))))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("官網 header 的登入狀態", () => {
  const signal = new AbortController().signal

  it("已登入時回傳名稱與頭像", async () => {
    respond(new Response(JSON.stringify({ id: "1", name: "n", avatar_url: "a", account: null }), { status: 200 }))
    expect(await loadMe(signal)).toMatchObject({ name: "n", avatar_url: "a" })
  })

  it.each([
    ["session_expired", () => new Response(JSON.stringify({ error: "session_expired" }), { status: 401 })],
    ["5xx", () => new Response("oops", { status: 502 })],
    ["非 JSON", () => new Response("<html>", { status: 200 })],
    ["欄位不對", () => new Response(JSON.stringify({ ok: true }), { status: 200 })],
    ["連不上", () => new TypeError("Failed to fetch")],
  ])("%s 時當成未登入", async (_, make) => {
    respond(make())
    expect(await loadMe(signal)).toBeNull()
  })
})
