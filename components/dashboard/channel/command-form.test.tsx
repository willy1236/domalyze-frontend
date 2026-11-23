import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { CommandForm } from "./command-form"

vi.mock("./channel-access-guard", () => ({ useChannelError: () => () => false }))

it("自訂指令表單的常客權限排在訂閱者和 VIP 之間", () => {
  const noop = () => {}
  const html = renderToStaticMarkup(
    <CommandForm channelId="777" original={null} onClose={noop} onChanged={noop} onNotEnabled={noop} />,
  )
  const doc = new DOMParser().parseFromString(html, "text/html")
  const options = Array.from(doc.querySelectorAll<HTMLOptionElement>("#command-permission option"))
  const subscriber = options.findIndex((option) => option.value === "subscriber")
  expect(options.slice(subscriber, subscriber + 3).map((option) => [option.value, option.textContent])).toEqual([
    ["subscriber", "訂閱者"],
    ["regular", "常客"],
    ["vip", "VIP"],
  ])
})