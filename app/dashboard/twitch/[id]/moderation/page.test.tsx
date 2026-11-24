/// <reference types="vite/client" />
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

vi.mock("@/components/dashboard/channel/channel-access-guard", () => ({
  useChannel: () => ({ id: "777", state: "enabled", role: "mod", mod_collab_enabled: true }),
  useChannelError: () => () => false,
  useReloadChannel: () => async () => {},
}))

const pages = import.meta.glob<{ default: React.ComponentType }>("./page.tsx")
const url = "/dashboard/channels/777/moderation"
const original = {
  enabled: false,
  exempt_level: "vip",
  params: { whitelist: ["youtube.com"] },
  notice: null as string | null,
  silent: false,
}
const kinds = ["link", "blocked_word", "caps", "emote", "symbol", "repetition", "length", "duplicate"]
const settings = {
  stages: [{ action: "delete", duration: null }, { action: "timeout", duration: 600 }],
  strike_reset_minutes: 60,
  raid_pause_seconds: 120,
  permit_seconds: 60,
  updated_at: null,
}

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

async function openPage(error?: { status: number; code: string }, linkStages: typeof settings.stages | null = null) {
  let penalties = settings
  let link = { kind: "link", ...original, stages: linkStages, updated_at: null as string | null }
  const edits: unknown[] = []
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input, "https://example.test").pathname
    if (init?.method === "PUT") {
      expect([url + "/settings", url + "/filters/link"]).toContain(path)
      const body = JSON.parse(String(init.body))
      edits.push({ path, ...body })
      if (error) return Response.json({ error: error.code }, { status: error.status })
      if (path === url + "/settings") {
        penalties = { ...penalties, ...body.values }
        return Response.json({ settings: penalties })
      }
      link = { ...link, ...body.values, updated_at: "2026-11-23T10:00:00Z" }
      return Response.json({ filter: link })
    }
    expect(path).toBe(url)
    return Response.json({
      settings: penalties,
      filters: kinds.map((kind) =>
        kind === "link" ? link : { ...link, kind, enabled: false, params: {}, notice: null, silent: false, stages: null },
      ),
    })
  })
  vi.stubGlobal("fetch", fetch)
  const loadPage = pages["./page.tsx"]
  expect(loadPage, "聊天室管理頁尚未實作").toBeDefined()
  const { default: Page } = await loadPage()
  await act(async () => root.render(<Page />))
  expect(fetch).toHaveBeenCalled()
  return edits
}

function labelOf(control: HTMLElement) {
  const references = (control.getAttribute("aria-labelledby") ?? "").split(/\s+/)
  return [
    control.getAttribute("aria-label"),
    ...references.map((id) => document.getElementById(id)?.textContent),
    ...Array.from((control as HTMLInputElement).labels ?? [], (label) => label.textContent),
    control.closest("label")?.textContent,
    control.textContent,
  ].filter(Boolean).join(" ")
}

function visibleControl<T extends HTMLElement>(selector: string, label: RegExp, scope: ParentNode = container): T {
  const control = Array.from(scope.querySelectorAll<T>(selector)).find((element) => label.test(labelOf(element)))
  expect(control, `找不到欄位 ${label}`).toBeDefined()
  return control!
}

const toggleSelector = "input[type=checkbox], [role=switch]"

function checked(toggle: HTMLElement) {
  return toggle instanceof HTMLInputElement ? toggle.checked : toggle.getAttribute("aria-checked") === "true"
}

async function click(control: HTMLElement) {
  await act(async () => control.click())
}

async function save(scope: ParentNode) {
  await click(visibleControl<HTMLButtonElement>("button", /儲存/, scope))
}

function filterForm(label: RegExp) {
  const heading = visibleControl("h2, h3, h4, h5, h6, [role=heading]", label)
  const form = heading.closest("form")
  expect(form, `找不到 ${label} 過濾器的表單`).not.toBeNull()
  return form!
}

it("mod 可從預設關閉的連結卡開啟過濾並修改豁免層級與靜音", async () => {
  const edits = await openPage()
  const card = filterForm(/連結/)
  const enabled = visibleControl(toggleSelector, /啟用/, card)
  const silent = visibleControl(toggleSelector, /靜音/, card)
  const level = visibleControl<HTMLSelectElement>("select", /豁免/, card)
  expect(checked(enabled)).toBe(false)
  expect(checked(silent)).toBe(false)
  expect(level.value).toBe("vip")
  expect(Array.from(level.options, (option) => option.value).sort()).toEqual(["mod", "regular", "subscriber", "vip"])

  await click(enabled)
  await click(silent)
  await act(async () => {
    level.value = "regular"
    level.dispatchEvent(new Event("change", { bubbles: true }))
  })
  await save(card)

  expect(edits).toEqual([{
    path: url + "/filters/link",
    original: expect.objectContaining(original),
    values: expect.objectContaining({ ...original, enabled: true, exempt_level: "regular", silent: true }),
  }])
})

it.each([
  ["禁字", /禁字/],
  ["大寫", /大寫/],
  ["表情", /表情/],
  ["符號", /^(?!.*表情).*符號/],
  ["重複內容", /重複內容/],
  ["訊息過長", /訊息過長|訊息長度/],
  ["跨訊息重複", /跨訊息重複|重複發言/],
] as const)("後台可獨立開啟原本關閉的%s過濾器", async (_name, label) => {
  await openPage()
  const enabled = visibleControl(toggleSelector, /啟用/, filterForm(label))
  const link = visibleControl(toggleSelector, /啟用/, filterForm(/連結/))
  expect(checked(enabled)).toBe(false)
  expect(checked(link)).toBe(false)

  await click(enabled)

  expect(checked(enabled)).toBe(true)
  expect(checked(link)).toBe(false)
})

it("儲存告知遭 AutoMod 拒絕時顯示原因並保留輸入供修改", async () => {
  const edits = await openPage({ status: 422, code: "automod_blocked" })
  const card = filterForm(/連結/)
  const fields = "input[type=text], input:not([type]), textarea"
  const notice = visibleControl<HTMLInputElement | HTMLTextAreaElement>(fields, /告知/, card)
  const prototype = notice instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const draft = "請遵守聊天室規則"

  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(notice, draft)
    notice.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await save(card)

  expect(edits).toEqual([{
    path: url + "/filters/link",
    original: expect.objectContaining(original),
    values: expect.objectContaining({ ...original, notice: draft }),
  }])
  expect(container.textContent).toMatch(/AutoMod.*擋下|AutoMod.*拒絕/)
  expect(visibleControl<HTMLInputElement | HTMLTextAreaElement>(fields, /告知/, card).value)
    .toBe(draft)
})

async function setNumber(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

it("處罰設定可修改犯規次數歸零與放行時間", async () => {
  const edits = await openPage()
  visibleControl("h2, h3, h4, h5, h6, [role=heading]", /處罰設定/)
  const reset = visibleControl<HTMLInputElement>("input", /歸零/)
  const permit = visibleControl<HTMLInputElement>("input", /放行/)
  expect(reset.value).toBe("60")
  expect(permit.value).toBe("60")

  await setNumber(reset, "5")
  await setNumber(permit, "120")
  await save(reset.form ?? reset.closest("section") ?? container)

  expect(edits).toEqual([{
    path: url + "/settings",
    original: expect.objectContaining({ strike_reset_minutes: 60, permit_seconds: 60 }),
    values: expect.objectContaining({ strike_reset_minutes: 5, permit_seconds: 120 }),
  }])
})

it("關閉過濾器自己的處罰階段後，儲存為沿用頻道預設", async () => {
  const stages = [{ action: "ban", duration: null }]
  const edits = await openPage(undefined, stages)
  const card = filterForm(/連結/)
  const override = visibleControl(toggleSelector, /使用自己的處罰階段/, card)
  expect(checked(override)).toBe(true)

  await click(override)
  await save(card)

  expect(edits).toEqual([{
    path: url + "/filters/link",
    original: expect.objectContaining({ stages }),
    values: expect.objectContaining({ stages: null }),
  }])
})
