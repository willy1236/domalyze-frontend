import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { type NetbirdState, NetbirdView } from "./netbird"

const peer = { name: "pc", ip: "100.1.1.1", connected: true, last_seen: "2026-11-17T01:02:03Z", os: "Windows", version: "0.30" }
const state = (over: Partial<NetbirdState> = {}): NetbirdState => ({ writable: true, unavailable: false, bound: true, peers: [peer], ...over })
const render = (s: NetbirdState, setup: { command: string; bat: string } | null = null) =>
  renderToStaticMarkup(<NetbirdView state={s} setup={setup} busy={false} error={null} onSetup={() => {}} />)

describe("NetbirdView", () => {
  it("已綁定時顯示節點資訊，格式同 /game netbird", () => {
    const out = render(state())
    expect(out).toContain("pc")
    expect(out).toContain("100.1.1.1")
    expect(out).toContain("🟢 在線")
    expect(out).toContain("2026-11-17 01:02:03")
    expect(out).toContain("Windows")
    expect(out).toContain("0.30")
  })

  it("綁定了但沒有節點時顯示尚未偵測到節點", () => {
    expect(render(state({ peers: [] }))).toContain("尚未偵測到節點")
  })

  it("沒有綁定時顯示尚未綁定", () => {
    expect(render(state({ bound: false, peers: [] }))).toContain("尚未綁定 NetBird")
  })

  it("暫時無法載入時不顯示綁定狀態", () => {
    const out = render(state({ unavailable: true, bound: false, peers: [] }))
    expect(out).toContain("暫時無法載入")
    expect(out).not.toContain("尚未綁定")
  })

  it("有析域帳號時顯示產生按鈕，打開時不顯示指令", () => {
    const out = render(state())
    expect(out).toContain("產生安裝指令")
    expect(out).not.toContain("netbird up")
  })

  it("沒有析域帳號時唯讀：看得到節點，沒有按鈕", () => {
    const out = render(state({ writable: false }))
    expect(out).toContain("100.1.1.1")
    expect(out).not.toContain("產生安裝指令")
  })

  it("產生後顯示指令、下載與 24 小時一次性的提醒", () => {
    const out = render(state(), { command: "netbird up --setup-key K", bat: "@echo off" })
    expect(out).toContain("netbird up --setup-key K")
    expect(out).toContain("下載 .bat")
    expect(out).toContain("24 小時內有效且只能使用一次")
  })
})
