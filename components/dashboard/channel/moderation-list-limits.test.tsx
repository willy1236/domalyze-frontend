import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { ModerationFilterCard, type ModerationFilter } from "./moderation-filter-card"

vi.mock("./channel-access-guard", () => ({
  useChannelError: () => () => false,
  useReloadChannel: () => async () => {},
}))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

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

it.each<[ModerationFilter["kind"], string]>([
  ["link", Array.from({ length: 101 }, (_, index) => `example${index}.com`).join("\n")],
  ["blocked_word", "字".repeat(101)],
])("%s 顯示清單上限並攔截超限輸入", async (kind, text) => {
  const fetch = vi.fn()
  vi.stubGlobal("fetch", fetch)
  await act(async () => root.render(
    <ModerationFilterCard
      filter={{ kind, enabled: true, exempt_level: "vip", params: {}, notice: null, silent: true, stages: null, updated_at: null }}
      endpoint="/dashboard/test"
      disabled={false}
      onReload={async () => {}}
    />,
  ))
  const field = container.querySelector("textarea")!
  expect(container.textContent).toContain("最多 100 項，每項最多 100 字")
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(field, text)
    field.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  })
  expect(container.querySelector("[role=alert]")?.textContent).toContain("最多 100 項，每項最多 100 字")
  expect(fetch).not.toHaveBeenCalled()
})
