import { act } from "react"
import { createRoot } from "react-dom/client"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

const ctx = vi.hoisted(() => ({ actions: [] as string[] }))
vi.mock("@/components/dashboard/guild-sections", () => ({
  useGuildSections: () => ({
    sections: null,
    failed: false,
    can: (_section: string, action = "view") => ctx.actions.includes(action),
    reload: () => {},
  }),
}))

import { PunishForm } from "./punish-form"

const render = (actions: string[]) => {
  ctx.actions = actions
  return renderToStaticMarkup(<PunishForm guildId="1" reload={() => {}} />)
}

describe("PunishForm", () => {
  it("只有檢視權限時不顯示按鈕與表單", () => {
    expect(render(["view"])).toBe("")
  })

  it("只列出有權限的種類分頁", () => {
    const out = render(["view", "add", "ban"])
    expect(out).toContain("新增懲處")
    expect(out).toContain(">警告<")
    expect(out).toContain(">停權<")
    expect(out).not.toContain(">禁言<")
    expect(out).not.toContain(">踢出<")
  })

  it("預設分頁是第一個有權限的種類，只有停權權限時沒有警告分頁", () => {
    const out = render(["view", "ban"])
    expect(out).not.toContain(">警告<")
    expect(out).toContain("執行停權")
  })

  it("禁言分頁有時長與刪訊息選項，並提示只能選伺服器內成員", () => {
    const out = render(["view", "timeout"])
    expect(out).toContain("禁言時長")
    expect(out).toContain("刪除對象最近的訊息")
    expect(out).toContain("只能選伺服器內的成員")
  })

  it("警告分頁沒有時長與刪訊息選項", () => {
    const out = render(["view", "add"])
    expect(out).not.toContain("禁言時長")
    expect(out).not.toContain("刪除對象最近的訊息")
  })

  it("禁言的時長與刪訊息可自訂，停權的刪訊息只有預設選項", () => {
    expect(render(["view", "timeout"]).match(/自訂…/g)).toHaveLength(2)
    expect(render(["view", "ban"])).not.toContain("自訂…")
  })
})

describe("PunishForm 切分頁再切回", () => {
  let container: HTMLElement | null = null
  afterEach(() => {
    container?.remove()
    container = null
  })

  const mount = async () => {
    ctx.actions = ["view", "add", "timeout", "kick", "ban"]
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement("div")
    document.body.appendChild(container)
    await act(async () => createRoot(container!).render(<PunishForm guildId="1" reload={() => {}} />))
    return container
  }
  const tab = (root: HTMLElement, label: string) =>
    [...root.querySelectorAll<HTMLElement>('[role="tab"]')].find((t) => t.textContent === label)!
  const field = (root: HTMLElement, label: string) => root.querySelector<HTMLSelectElement>(`select[id$="-${label}"]`)!
  const setSelect = async (el: HTMLSelectElement, value: string) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(el, value)
      el.dispatchEvent(new Event("change", { bubbles: true }))
    })
  const setInput = async (el: HTMLInputElement, value: string) =>
    act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value)
      el.dispatchEvent(new Event("input", { bubbles: true }))
    })
  const click = async (el: HTMLElement) => act(async () => el.click())

  it("禁言的自訂時長與刪訊息秒數切走再切回，仍顯示自訂值", async () => {
    const root = await mount()
    await click(tab(root, "禁言"))
    await setSelect(field(root, "duration"), "custom")
    await setInput(root.querySelector<HTMLInputElement>('input[aria-label="禁言時長的數值"]')!, "90")
    await setSelect(field(root, "delete"), "custom")
    await setInput(root.querySelector<HTMLInputElement>('input[aria-label="刪除對象最近的訊息的數值"]')!, "1234")

    await click(tab(root, "踢出"))
    await click(tab(root, "禁言"))

    expect(field(root, "duration").value).toBe("custom")
    expect(root.querySelector<HTMLInputElement>('input[aria-label="禁言時長的數值"]')!.value).toBe("90")
    expect(field(root, "delete").value).toBe("custom")
    expect(root.querySelector<HTMLInputElement>('input[aria-label="刪除對象最近的訊息的數值"]')!.value).toBe("1234")
  })

  it("禁言的自訂刪訊息值切到停權不會帶入，停權下拉顯示並選到「不要刪除訊息」", async () => {
    const root = await mount()
    await click(tab(root, "禁言"))
    await setSelect(field(root, "delete"), "custom")
    await setInput(root.querySelector<HTMLInputElement>('input[aria-label="刪除對象最近的訊息的數值"]')!, "1234")
    await click(tab(root, "停權"))
    expect(field(root, "delete").value).toBe("0")
    expect(root.querySelector('option[value="custom"]')).toBeNull()
  })

  it("自訂欄位清空（NaN）切走再切回不會出現 NaN", async () => {
    const root = await mount()
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    await click(tab(root, "禁言"))
    await setSelect(field(root, "delete"), "custom")
    await click(tab(root, "停權"))
    await click(tab(root, "禁言"))
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })
})
